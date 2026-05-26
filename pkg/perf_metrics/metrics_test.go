package perfmetrics

import (
	"sync"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/glebarez/sqlite"
	redis "github.com/go-redis/redis/v8"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupPerfMetricTestDB(t *testing.T) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	model.DB = db
	model.LOG_DB = db
	common.UsingSQLite = true
	common.UsingPostgreSQL = false
	common.UsingMySQL = false
	common.RedisEnabled = false
	common.RDB = nil

	require.NoError(t, db.AutoMigrate(&model.PerfMetric{}))
	t.Cleanup(func() {
		hotBuckets = sync.Map{}
		summaryCache = sync.Map{}
		summarySeriesCache = sync.Map{}
		common.RedisEnabled = false
		common.RDB = nil
	})
}

func TestQuerySummaryAllReturnsModelAvailability(t *testing.T) {
	setupPerfMetricTestDB(t)
	bucket := bucketStart(time.Now().Unix())

	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex",
		BucketTs:       bucket,
		RequestCount:   4,
		SuccessCount:   3,
		TotalLatencyMs: 12000,
		OutputTokens:   600,
		GenerationMs:   3000,
	}))

	result, err := QuerySummaryAll(24, []string{"codex"})
	require.NoError(t, err)
	require.Len(t, result.Models, 1)
	require.Equal(t, "gpt-5.5", result.Models[0].ModelName)
	require.Equal(t, int64(3000), result.Models[0].AvgLatencyMs)
	require.Equal(t, 75.0, result.Models[0].SuccessRate)
	require.Equal(t, 200.0, result.Models[0].AvgTps)
}

func TestQuerySummarySeriesAllReturnsModelSeries(t *testing.T) {
	setupPerfMetricTestDB(t)
	bucket := bucketStart(time.Now().Unix())
	previousBucket := bucket - 3600

	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex",
		BucketTs:       previousBucket,
		RequestCount:   4,
		SuccessCount:   4,
		TotalLatencyMs: 8000,
		TtftSumMs:      1200,
		TtftCount:      4,
		OutputTokens:   400,
		GenerationMs:   2000,
	}))
	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex_520",
		BucketTs:       bucket,
		RequestCount:   2,
		SuccessCount:   1,
		TotalLatencyMs: 6000,
		TtftSumMs:      800,
		TtftCount:      2,
		OutputTokens:   300,
		GenerationMs:   1500,
	}))

	result, err := QuerySummarySeriesAll(24, []string{"codex", "codex_520"})
	require.NoError(t, err)
	require.Len(t, result.Models, 1)
	require.Equal(t, "gpt-5.5", result.Models[0].ModelName)
	require.Equal(t, int64(6), result.Models[0].RequestCount)
	require.Equal(t, 83.33, result.Models[0].SuccessRate)
	require.Equal(t, 200.0, result.Models[0].AvgTps)
	require.Len(t, result.Models[0].Series, 2)
	require.Equal(t, previousBucket, result.Models[0].Series[0].Ts)
	require.Equal(t, int64(4), result.Models[0].Series[0].RequestCount)
	require.Equal(t, int64(300), result.Models[0].Series[0].AvgTtftMs)
	require.Equal(t, 100.0, result.Models[0].Series[0].SuccessRate)
	require.Equal(t, bucket, result.Models[0].Series[1].Ts)
	require.Equal(t, int64(2), result.Models[0].Series[1].RequestCount)
	require.Equal(t, int64(400), result.Models[0].Series[1].AvgTtftMs)
	require.Equal(t, 50.0, result.Models[0].Series[1].SuccessRate)
}

func TestQuerySummarySeriesAllFallsBackToLocalActiveBucketWhenRedisUnavailable(t *testing.T) {
	setupPerfMetricTestDB(t)
	redisClient := redis.NewClient(&redis.Options{
		Addr:         "127.0.0.1:0",
		DialTimeout:  10 * time.Millisecond,
		ReadTimeout:  10 * time.Millisecond,
		WriteTimeout: 10 * time.Millisecond,
	})
	t.Cleanup(func() {
		_ = redisClient.Close()
	})
	common.RedisEnabled = true
	common.RDB = redisClient

	bucket := bucketStart(time.Now().Unix())
	active := &atomicBucket{}
	active.add(Sample{
		Model:        "gpt-5.5",
		Group:        "codex",
		LatencyMs:    1000,
		Success:      true,
		OutputTokens: 200,
		GenerationMs: 1000,
	})
	hotBuckets.Store(bucketKey{model: "gpt-5.5", group: "codex", bucketTs: bucket}, active)

	result, err := QuerySummarySeriesAll(24, []string{"codex"})
	require.NoError(t, err)
	require.Len(t, result.Models, 1)
	require.Equal(t, "gpt-5.5", result.Models[0].ModelName)
	require.Equal(t, int64(1), result.Models[0].RequestCount)
	require.Equal(t, 100.0, result.Models[0].SuccessRate)
	require.Len(t, result.Models[0].Series, 1)
	require.Equal(t, bucket, result.Models[0].Series[0].Ts)
}

func TestRedisCoveredActiveBucketSkipsOnlyExactLocalBucket(t *testing.T) {
	activeBucket := int64(3600)
	covered := map[bucketKey]struct{}{
		{model: "model-a", group: "codex", bucketTs: activeBucket}: {},
	}

	require.True(t, redisCoveredActiveBucket(covered, bucketKey{model: "model-a", group: "codex", bucketTs: activeBucket}, activeBucket))
	require.False(t, redisCoveredActiveBucket(covered, bucketKey{model: "model-b", group: "codex", bucketTs: activeBucket}, activeBucket))
	require.False(t, redisCoveredActiveBucket(covered, bucketKey{model: "model-a", group: "codex_520", bucketTs: activeBucket}, activeBucket))
	require.False(t, redisCoveredActiveBucket(covered, bucketKey{model: "model-a", group: "codex", bucketTs: activeBucket - 3600}, activeBucket))
	require.False(t, redisCoveredActiveBucket(nil, bucketKey{model: "model-a", group: "codex", bucketTs: activeBucket}, activeBucket))
}

func TestQueryReturnsPerGroupAvailabilitySeries(t *testing.T) {
	setupPerfMetricTestDB(t)
	bucket := bucketStart(time.Now().Unix())

	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex",
		BucketTs:       bucket,
		RequestCount:   2,
		SuccessCount:   1,
		TotalLatencyMs: 5000,
		TtftSumMs:      800,
		TtftCount:      2,
		OutputTokens:   100,
		GenerationMs:   1000,
	}))

	result, err := Query(QueryParams{Model: "gpt-5.5", Group: "codex", Hours: 24})
	require.NoError(t, err)
	require.Equal(t, "gpt-5.5", result.ModelName)
	require.Len(t, result.Groups, 1)
	require.Equal(t, "codex", result.Groups[0].Group)
	require.Equal(t, 50.0, result.Groups[0].SuccessRate)
	require.Equal(t, int64(2500), result.Groups[0].AvgLatencyMs)
	require.Equal(t, int64(400), result.Groups[0].AvgTtftMs)
	require.Equal(t, 100.0, result.Groups[0].AvgTps)
	require.Len(t, result.Groups[0].Series, 1)
	require.Equal(t, 50.0, result.Groups[0].Series[0].SuccessRate)
}

func TestQuerySummaryAllUsesShortCache(t *testing.T) {
	setupPerfMetricTestDB(t)
	bucket := bucketStart(time.Now().Unix())

	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex",
		BucketTs:       bucket,
		RequestCount:   1,
		SuccessCount:   1,
		TotalLatencyMs: 1000,
	}))

	first, err := QuerySummaryAll(24, []string{"codex"})
	require.NoError(t, err)
	require.Len(t, first.Models, 1)
	require.Equal(t, int64(1000), first.Models[0].AvgLatencyMs)

	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex",
		BucketTs:       bucket,
		RequestCount:   1,
		SuccessCount:   1,
		TotalLatencyMs: 9000,
	}))

	second, err := QuerySummaryAll(24, []string{"codex"})
	require.NoError(t, err)
	require.Equal(t, first, second)
}

func TestQuerySummarySeriesAllUsesShortCache(t *testing.T) {
	setupPerfMetricTestDB(t)
	bucket := bucketStart(time.Now().Unix())

	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex",
		BucketTs:       bucket,
		RequestCount:   1,
		SuccessCount:   1,
		TotalLatencyMs: 1000,
	}))

	first, err := QuerySummarySeriesAll(24, []string{"codex"})
	require.NoError(t, err)
	require.Len(t, first.Models, 1)
	require.Len(t, first.Models[0].Series, 1)
	require.Equal(t, int64(1000), first.Models[0].AvgLatencyMs)

	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "codex",
		BucketTs:       bucket,
		RequestCount:   1,
		SuccessCount:   1,
		TotalLatencyMs: 9000,
	}))

	second, err := QuerySummarySeriesAll(24, []string{"codex"})
	require.NoError(t, err)
	require.Equal(t, first, second)
}

func TestRedisBucketKeyEscapesColonInModelAndGroup(t *testing.T) {
	key := bucketKey{model: "openai:gpt-5.5", group: "codex:fast", bucketTs: 3600}
	raw := redisBucketKey(key)

	parsed, ok := parseRedisBucketKey(raw)
	require.True(t, ok)
	require.Equal(t, key, parsed)
}
