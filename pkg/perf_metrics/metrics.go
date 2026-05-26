package perfmetrics

import (
	"context"
	"encoding/base64"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/perf_metrics_setting"
)

var hotBuckets sync.Map
var summaryCache sync.Map
var summarySeriesCache sync.Map

// seriesSchema is a stable client cache/schema marker. Do not change it when
// hiding fields or making response-only privacy hardening changes.
const seriesSchema = "dbcd0a3c01b55203"

func Init() {
	go flushLoop()
}

func RecordRelaySample(info *relaycommon.RelayInfo, success bool, outputTokens int64) {
	if info == nil {
		return
	}
	now := time.Now()
	hasTtft := info.IsStream && info.HasSendResponse()
	ttftMs := int64(0)
	if hasTtft {
		ttftMs = info.FirstResponseTime.Sub(info.StartTime).Milliseconds()
	}
	latencyMs := now.Sub(info.StartTime).Milliseconds()
	generationMs := latencyMs
	if hasTtft {
		generationMs = now.Sub(info.FirstResponseTime).Milliseconds()
	}
	if generationMs <= 0 {
		generationMs = latencyMs
	}
	Record(Sample{
		Model:        info.OriginModelName,
		Group:        info.UsingGroup,
		LatencyMs:    latencyMs,
		TtftMs:       ttftMs,
		HasTtft:      hasTtft,
		Success:      success,
		OutputTokens: outputTokens,
		GenerationMs: generationMs,
	})
}

func Record(sample Sample) {
	setting := perf_metrics_setting.GetSetting()
	if !setting.Enabled || sample.Model == "" {
		return
	}
	if sample.Group == "" {
		sample.Group = "default"
	}
	if sample.LatencyMs < 0 {
		sample.LatencyMs = 0
	}

	key := bucketKey{
		model:    sample.Model,
		group:    sample.Group,
		bucketTs: bucketStart(time.Now().Unix()),
	}
	actual, _ := hotBuckets.LoadOrStore(key, &atomicBucket{})
	actual.(*atomicBucket).add(sample)
	recordRedis(key, sample)
}

func Query(params QueryParams) (QueryResult, error) {
	if params.Hours <= 0 {
		params.Hours = 24
	}
	if params.Hours > 24*30 {
		params.Hours = 24 * 30
	}
	endTs := time.Now().Unix()
	startTs := endTs - int64(params.Hours)*3600
	activeBucket := bucketStart(endTs)

	merged := map[bucketKey]counters{}
	rows, err := model.GetPerfMetrics(params.Model, params.Group, startTs, endTs)
	if err != nil {
		return QueryResult{}, err
	}
	for _, row := range rows {
		mergeCounters(merged, bucketKey{
			model:    row.ModelName,
			group:    row.Group,
			bucketTs: row.BucketTs,
		}, counters{
			requestCount:   row.RequestCount,
			successCount:   row.SuccessCount,
			totalLatencyMs: row.TotalLatencyMs,
			ttftSumMs:      row.TtftSumMs,
			ttftCount:      row.TtftCount,
			outputTokens:   row.OutputTokens,
			generationMs:   row.GenerationMs,
		})
	}
	redisActiveBuckets := mergeRedisActiveBuckets(merged, params, startTs, endTs)

	hotBuckets.Range(func(key, value any) bool {
		k := key.(bucketKey)
		if k.model != params.Model || k.bucketTs < startTs || k.bucketTs > endTs {
			return true
		}
		if redisCoveredActiveBucket(redisActiveBuckets, k, activeBucket) {
			return true
		}
		if params.Group != "" && k.group != params.Group {
			return true
		}
		mergeCounters(merged, k, value.(*atomicBucket).snapshot())
		return true
	})

	return buildQueryResult(params.Model, merged), nil
}

func QuerySummaryAll(hours int, groups []string) (SummaryAllResult, error) {
	if hours <= 0 {
		hours = 24
	}
	if hours > 24*30 {
		hours = 24 * 30
	}
	endTs := time.Now().Unix()
	startTs := endTs - int64(hours)*3600
	activeBucket := bucketStart(endTs)
	allowedGroups := allowedGroupSet(groups)
	cacheKey := summaryCacheKey(hours, groups, activeBucket)
	if cached, ok := summaryCache.Load(cacheKey); ok {
		entry := cached.(summaryCacheEntry)
		if time.Now().Before(entry.expiresAt) {
			return entry.result, nil
		}
		summaryCache.Delete(cacheKey)
	}

	rows, err := model.GetPerfMetricsSummaryAll(startTs, endTs, groups)
	if err != nil {
		return SummaryAllResult{}, err
	}

	totals := map[string]counters{}
	for _, row := range rows {
		totals[row.ModelName] = counters{
			requestCount:   row.RequestCount,
			successCount:   row.SuccessCount,
			totalLatencyMs: row.TotalLatencyMs,
			outputTokens:   row.OutputTokens,
			generationMs:   row.GenerationMs,
		}
	}

	redisActiveBuckets := mergeRedisSummaryActiveBuckets(totals, allowedGroups, startTs, endTs)

	hotBuckets.Range(func(key, value any) bool {
		k := key.(bucketKey)
		if k.bucketTs < startTs || k.bucketTs > endTs {
			return true
		}
		if redisCoveredActiveBucket(redisActiveBuckets, k, activeBucket) {
			return true
		}
		if allowedGroups != nil {
			if _, ok := allowedGroups[k.group]; !ok {
				return true
			}
		}
		snap := value.(*atomicBucket).snapshot()
		if snap.requestCount == 0 {
			return true
		}
		cur := totals[k.model]
		cur.requestCount += snap.requestCount
		cur.successCount += snap.successCount
		cur.totalLatencyMs += snap.totalLatencyMs
		cur.outputTokens += snap.outputTokens
		cur.generationMs += snap.generationMs
		totals[k.model] = cur
		return true
	})

	models := make([]ModelSummary, 0, len(totals))
	for name, total := range totals {
		if total.requestCount == 0 {
			continue
		}
		avgLatency := total.totalLatencyMs / total.requestCount
		successRate := float64(total.successCount) / float64(total.requestCount) * 100
		avgTps := 0.0
		if total.generationMs > 0 {
			avgTps = float64(total.outputTokens) / (float64(total.generationMs) / 1000.0)
		}
		models = append(models, ModelSummary{
			ModelName:    name,
			AvgLatencyMs: avgLatency,
			SuccessRate:  math.Round(successRate*100) / 100,
			AvgTps:       math.Round(avgTps*100) / 100,
			RequestCount: total.requestCount,
		})
	}
	sort.Slice(models, func(i, j int) bool {
		return models[i].RequestCount > models[j].RequestCount
	})

	result := SummaryAllResult{Models: models}
	summaryCache.Store(cacheKey, summaryCacheEntry{
		result:    result,
		expiresAt: time.Now().Add(30 * time.Second),
	})
	return result, nil
}

func QuerySummarySeriesAll(hours int, groups []string) (SummarySeriesAllResult, error) {
	if hours <= 0 {
		hours = 24
	}
	if hours > 24*30 {
		hours = 24 * 30
	}
	endTs := time.Now().Unix()
	startTs := endTs - int64(hours)*3600
	activeBucket := bucketStart(endTs)
	allowedGroups := allowedGroupSet(groups)
	cacheKey := summaryCacheKey(hours, groups, activeBucket)
	if cached, ok := summarySeriesCache.Load(cacheKey); ok {
		entry := cached.(summarySeriesCacheEntry)
		if time.Now().Before(entry.expiresAt) {
			return entry.result, nil
		}
		summarySeriesCache.Delete(cacheKey)
	}

	rows, err := model.GetPerfMetricsSummarySeriesAll(startTs, endTs, groups)
	if err != nil {
		return SummarySeriesAllResult{}, err
	}

	merged := map[bucketKey]counters{}
	for _, row := range rows {
		mergeCounters(merged, bucketKey{
			model:    row.ModelName,
			bucketTs: row.BucketTs,
		}, counters{
			requestCount:   row.RequestCount,
			successCount:   row.SuccessCount,
			totalLatencyMs: row.TotalLatencyMs,
			ttftSumMs:      row.TtftSumMs,
			ttftCount:      row.TtftCount,
			outputTokens:   row.OutputTokens,
			generationMs:   row.GenerationMs,
		})
	}

	redisActiveBuckets := mergeRedisSummarySeriesActiveBuckets(merged, allowedGroups, startTs, endTs)

	hotBuckets.Range(func(key, value any) bool {
		k := key.(bucketKey)
		if k.bucketTs < startTs || k.bucketTs > endTs {
			return true
		}
		if redisCoveredActiveBucket(redisActiveBuckets, k, activeBucket) {
			return true
		}
		if allowedGroups != nil {
			if _, ok := allowedGroups[k.group]; !ok {
				return true
			}
		}
		seriesKey := bucketKey{model: k.model, bucketTs: k.bucketTs}
		mergeCounters(merged, seriesKey, value.(*atomicBucket).snapshot())
		return true
	})

	result := buildSummarySeriesResult(merged)
	summarySeriesCache.Store(cacheKey, summarySeriesCacheEntry{
		result:    result,
		expiresAt: time.Now().Add(30 * time.Second),
	})
	return result, nil
}

type summaryCacheEntry struct {
	result    SummaryAllResult
	expiresAt time.Time
}

type summarySeriesCacheEntry struct {
	result    SummarySeriesAllResult
	expiresAt time.Time
}

func summaryCacheKey(hours int, groups []string, activeBucket int64) string {
	groupsCopy := append([]string(nil), groups...)
	sort.Strings(groupsCopy)
	return fmt.Sprintf("%d:%d:%v", hours, activeBucket, groupsCopy)
}

func buildSummarySeriesResult(merged map[bucketKey]counters) SummarySeriesAllResult {
	modelBuckets := map[string]map[int64]counters{}
	modelTotals := map[string]counters{}
	for key, value := range merged {
		if value.requestCount == 0 {
			continue
		}
		if _, ok := modelBuckets[key.model]; !ok {
			modelBuckets[key.model] = map[int64]counters{}
		}
		modelBuckets[key.model][key.bucketTs] = value
		total := modelTotals[key.model]
		total.requestCount += value.requestCount
		total.successCount += value.successCount
		total.totalLatencyMs += value.totalLatencyMs
		total.outputTokens += value.outputTokens
		total.generationMs += value.generationMs
		modelTotals[key.model] = total
	}

	models := make([]ModelSummarySeries, 0, len(modelBuckets))
	for modelName, buckets := range modelBuckets {
		timestamps := make([]int64, 0, len(buckets))
		for ts := range buckets {
			timestamps = append(timestamps, ts)
		}
		sort.Slice(timestamps, func(i, j int) bool { return timestamps[i] < timestamps[j] })
		series := make([]BucketPoint, 0, len(timestamps))
		for _, ts := range timestamps {
			series = append(series, bucketPoint(ts, buckets[ts]))
		}
		total := modelTotals[modelName]
		models = append(models, ModelSummarySeries{
			ModelSummary: ModelSummary{
				ModelName:    modelName,
				AvgLatencyMs: avg(total.totalLatencyMs, total.requestCount),
				SuccessRate:  math.Round(successRate(total)*100) / 100,
				AvgTps:       math.Round(avgTps(total)*100) / 100,
				RequestCount: total.requestCount,
			},
			Series: series,
		})
	}
	sort.Slice(models, func(i, j int) bool {
		return models[i].RequestCount > models[j].RequestCount
	})
	return SummarySeriesAllResult{SeriesSchema: seriesSchema, Models: models}
}

func allowedGroupSet(groups []string) map[string]struct{} {
	if groups == nil {
		return nil
	}
	allowed := make(map[string]struct{}, len(groups))
	for _, group := range groups {
		allowed[group] = struct{}{}
	}
	return allowed
}

func bucketStart(ts int64) int64 {
	bucketSeconds := perf_metrics_setting.GetBucketSeconds()
	if bucketSeconds <= 0 {
		bucketSeconds = 3600
	}
	return ts - (ts % bucketSeconds)
}

func mergeCounters(merged map[bucketKey]counters, key bucketKey, value counters) {
	if value.requestCount == 0 {
		return
	}
	current := merged[key]
	current.requestCount += value.requestCount
	current.successCount += value.successCount
	current.totalLatencyMs += value.totalLatencyMs
	current.ttftSumMs += value.ttftSumMs
	current.ttftCount += value.ttftCount
	current.outputTokens += value.outputTokens
	current.generationMs += value.generationMs
	merged[key] = current
}

func buildQueryResult(modelName string, merged map[bucketKey]counters) QueryResult {
	groupBuckets := map[string]map[int64]counters{}
	for key, value := range merged {
		if value.requestCount == 0 {
			continue
		}
		if _, ok := groupBuckets[key.group]; !ok {
			groupBuckets[key.group] = map[int64]counters{}
		}
		groupBuckets[key.group][key.bucketTs] = value
	}

	groups := make([]string, 0, len(groupBuckets))
	for group := range groupBuckets {
		groups = append(groups, group)
	}
	sort.Strings(groups)

	results := make([]GroupResult, 0, len(groups))
	for _, group := range groups {
		buckets := groupBuckets[group]
		timestamps := make([]int64, 0, len(buckets))
		for ts := range buckets {
			timestamps = append(timestamps, ts)
		}
		sort.Slice(timestamps, func(i, j int) bool {
			return timestamps[i] < timestamps[j]
		})

		total := counters{}
		series := make([]BucketPoint, 0, len(timestamps))
		for _, ts := range timestamps {
			value := buckets[ts]
			total.requestCount += value.requestCount
			total.successCount += value.successCount
			total.totalLatencyMs += value.totalLatencyMs
			total.ttftSumMs += value.ttftSumMs
			total.ttftCount += value.ttftCount
			total.outputTokens += value.outputTokens
			total.generationMs += value.generationMs
			series = append(series, bucketPoint(ts, value))
		}

		results = append(results, GroupResult{
			Group:        group,
			AvgTtftMs:    avg(total.ttftSumMs, total.ttftCount),
			AvgLatencyMs: avg(total.totalLatencyMs, total.requestCount),
			SuccessRate:  successRate(total),
			AvgTps:       avgTps(total),
			Series:       series,
		})
	}

	return QueryResult{
		ModelName:    modelName,
		SeriesSchema: seriesSchema,
		Groups:       results,
	}
}

func bucketPoint(ts int64, value counters) BucketPoint {
	return BucketPoint{
		Ts:           ts,
		AvgTtftMs:    avg(value.ttftSumMs, value.ttftCount),
		AvgLatencyMs: avg(value.totalLatencyMs, value.requestCount),
		SuccessRate:  successRate(value),
		AvgTps:       avgTps(value),
		RequestCount: value.requestCount,
	}
}

func avg(sum int64, count int64) int64 {
	if count <= 0 {
		return 0
	}
	return sum / count
}

func successRate(value counters) float64 {
	if value.requestCount <= 0 {
		return 0
	}
	return float64(value.successCount) / float64(value.requestCount) * 100
}

func avgTps(value counters) float64 {
	if value.outputTokens <= 0 || value.generationMs <= 0 {
		return 0
	}
	return float64(value.outputTokens) / (float64(value.generationMs) / 1000)
}

func recordRedis(key bucketKey, sample Sample) {
	if !common.RedisEnabled || common.RDB == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	redisKey := redisBucketKey(key)
	pipe := common.RDB.TxPipeline()
	pipe.HIncrBy(ctx, redisKey, "req", 1)
	if sample.Success {
		pipe.HIncrBy(ctx, redisKey, "ok", 1)
	}
	if sample.LatencyMs > 0 {
		pipe.HIncrBy(ctx, redisKey, "lat", sample.LatencyMs)
	}
	if sample.HasTtft && sample.TtftMs >= 0 {
		pipe.HIncrBy(ctx, redisKey, "ttft", sample.TtftMs)
		pipe.HIncrBy(ctx, redisKey, "ttft_n", 1)
	}
	if sample.OutputTokens > 0 && sample.GenerationMs > 0 {
		pipe.HIncrBy(ctx, redisKey, "out", sample.OutputTokens)
		pipe.HIncrBy(ctx, redisKey, "gen_ms", sample.GenerationMs)
	}
	pipe.Expire(ctx, redisKey, time.Hour)
	_, _ = pipe.Exec(ctx)
}

func redisCoveredActiveBucket(covered map[bucketKey]struct{}, key bucketKey, activeBucket int64) bool {
	if key.bucketTs != activeBucket {
		return false
	}
	_, ok := covered[key]
	return ok
}

func mergeRedisActiveBuckets(merged map[bucketKey]counters, params QueryParams, startTs int64, endTs int64) map[bucketKey]struct{} {
	if !common.RedisEnabled || common.RDB == nil || params.Model == "" {
		return nil
	}
	active := bucketStart(time.Now().Unix())
	if active < startTs || active > endTs {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	temp := map[bucketKey]counters{}
	covered := map[bucketKey]struct{}{}

	if params.Group != "" {
		key := bucketKey{model: params.Model, group: params.Group, bucketTs: active}
		values, err := common.RDB.HGetAll(ctx, redisBucketKey(key)).Result()
		if err != nil || len(values) == 0 {
			return nil
		}
		mergeCounters(temp, key, redisCounters(values))
		mergeCounters(merged, key, temp[key])
		covered[key] = struct{}{}
		return covered
	}

	pattern := fmt.Sprintf("perf:%s:*:%d", encodeRedisKeyPart(params.Model), active)
	iter := common.RDB.Scan(ctx, 0, pattern, 100).Iterator()
	found := false
	for iter.Next(ctx) {
		key, ok := parseRedisBucketKey(iter.Val())
		if !ok || key.model != params.Model {
			continue
		}
		values, err := common.RDB.HGetAll(ctx, iter.Val()).Result()
		if err != nil || len(values) == 0 {
			return nil
		}
		mergeCounters(temp, key, redisCounters(values))
		covered[key] = struct{}{}
		found = true
	}
	if err := iter.Err(); err != nil {
		return nil
	}
	for key, value := range temp {
		mergeCounters(merged, key, value)
	}
	if !found {
		return nil
	}
	return covered
}

func mergeRedisSummaryActiveBuckets(totals map[string]counters, allowedGroups map[string]struct{}, startTs int64, endTs int64) map[bucketKey]struct{} {
	if !common.RedisEnabled || common.RDB == nil {
		return nil
	}
	active := bucketStart(time.Now().Unix())
	if active < startTs || active > endTs {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	iter := common.RDB.Scan(ctx, 0, fmt.Sprintf("perf:*:*:%d", active), 100).Iterator()
	redisTotals := map[string]counters{}
	covered := map[bucketKey]struct{}{}
	found := false
	for iter.Next(ctx) {
		key, ok := parseRedisBucketKey(iter.Val())
		if !ok {
			continue
		}
		if allowedGroups != nil {
			if _, ok := allowedGroups[key.group]; !ok {
				continue
			}
		}
		values, err := common.RDB.HGetAll(ctx, iter.Val()).Result()
		if err != nil || len(values) == 0 {
			return nil
		}
		cur := redisTotals[key.model]
		redis := redisCounters(values)
		cur.requestCount += redis.requestCount
		cur.successCount += redis.successCount
		cur.totalLatencyMs += redis.totalLatencyMs
		cur.outputTokens += redis.outputTokens
		cur.generationMs += redis.generationMs
		redisTotals[key.model] = cur
		covered[key] = struct{}{}
		found = true
	}
	if err := iter.Err(); err != nil {
		return nil
	}
	for modelName, value := range redisTotals {
		cur := totals[modelName]
		cur.requestCount += value.requestCount
		cur.successCount += value.successCount
		cur.totalLatencyMs += value.totalLatencyMs
		cur.outputTokens += value.outputTokens
		cur.generationMs += value.generationMs
		totals[modelName] = cur
	}
	if !found {
		return nil
	}
	return covered
}

func mergeRedisSummarySeriesActiveBuckets(merged map[bucketKey]counters, allowedGroups map[string]struct{}, startTs int64, endTs int64) map[bucketKey]struct{} {
	if !common.RedisEnabled || common.RDB == nil {
		return nil
	}
	active := bucketStart(time.Now().Unix())
	if active < startTs || active > endTs {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	iter := common.RDB.Scan(ctx, 0, fmt.Sprintf("perf:*:*:%d", active), 100).Iterator()
	temp := map[bucketKey]counters{}
	covered := map[bucketKey]struct{}{}
	found := false
	for iter.Next(ctx) {
		key, ok := parseRedisBucketKey(iter.Val())
		if !ok {
			continue
		}
		if allowedGroups != nil {
			if _, ok := allowedGroups[key.group]; !ok {
				continue
			}
		}
		values, err := common.RDB.HGetAll(ctx, iter.Val()).Result()
		if err != nil || len(values) == 0 {
			return nil
		}
		seriesKey := bucketKey{model: key.model, bucketTs: key.bucketTs}
		mergeCounters(temp, seriesKey, redisCounters(values))
		covered[key] = struct{}{}
		found = true
	}
	if err := iter.Err(); err != nil {
		return nil
	}
	for key, value := range temp {
		mergeCounters(merged, key, value)
	}
	if !found {
		return nil
	}
	return covered
}

func parseRedisBucketKey(raw string) (bucketKey, bool) {
	var key bucketKey
	var bucketTs int64
	parts := strings.Split(raw, ":")
	if len(parts) != 4 || parts[0] != "perf" {
		return key, false
	}
	parsed, err := strconv.ParseInt(parts[3], 10, 64)
	if err != nil {
		return key, false
	}
	bucketTs = parsed
	modelName, err := decodeRedisKeyPart(parts[1])
	if err != nil {
		return key, false
	}
	group, err := decodeRedisKeyPart(parts[2])
	if err != nil {
		return key, false
	}
	return bucketKey{model: modelName, group: group, bucketTs: bucketTs}, true
}

func redisBucketKey(key bucketKey) string {
	return fmt.Sprintf("perf:%s:%s:%d", encodeRedisKeyPart(key.model), encodeRedisKeyPart(key.group), key.bucketTs)
}

func encodeRedisKeyPart(value string) string {
	return base64.RawURLEncoding.EncodeToString([]byte(value))
}

func decodeRedisKeyPart(value string) (string, error) {
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}
