package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupPerfMetricsControllerTestDB(t *testing.T) {
	t.Helper()

	gin.SetMode(gin.TestMode)
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false

	dsn := "file:" + strings.ReplaceAll(t.Name(), "/", "_") + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)

	model.DB = db
	model.LOG_DB = db
	require.NoError(t, db.AutoMigrate(&model.PerfMetric{}))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
}

func seedPerfMetric(t *testing.T) {
	t.Helper()
	now := time.Now().Unix()
	bucket := now - (now % 3600)
	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          "default",
		BucketTs:       bucket,
		RequestCount:   4,
		SuccessCount:   3,
		TotalLatencyMs: 12000,
		TtftSumMs:      1600,
		TtftCount:      4,
		OutputTokens:   600,
		GenerationMs:   3000,
	}))
}

func seedPerfMetricForGroup(t *testing.T, group string, requestCount int64, successCount int64) {
	t.Helper()
	now := time.Now().Unix()
	bucket := now - (now % 3600)
	require.NoError(t, model.UpsertPerfMetric(&model.PerfMetric{
		ModelName:      "gpt-5.5",
		Group:          group,
		BucketTs:       bucket,
		RequestCount:   requestCount,
		SuccessCount:   successCount,
		TotalLatencyMs: 1000 * requestCount,
		OutputTokens:   100 * requestCount,
		GenerationMs:   1000 * requestCount,
	}))
}

func TestGetPerfMetricsSummaryReturnsAvailability(t *testing.T) {
	setupPerfMetricsControllerTestDB(t)
	seedPerfMetric(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/perf-metrics/summary?hours=24", nil)

	GetPerfMetricsSummary(c)

	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"success":true`)
	require.Contains(t, w.Body.String(), `"model_name":"gpt-5.5"`)
	require.Contains(t, w.Body.String(), `"success_rate":75`)
	require.Contains(t, w.Body.String(), `"avg_latency_ms":3000`)
	require.NotContains(t, w.Body.String(), `"request_count"`)
}

func TestGetPerfMetricsSummarySeriesReturnsAvailabilitySeries(t *testing.T) {
	setupPerfMetricsControllerTestDB(t)
	seedPerfMetric(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/perf-metrics/summary-series?hours=24", nil)

	GetPerfMetricsSummarySeries(c)

	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"success":true`)
	require.Contains(t, w.Body.String(), `"model_name":"gpt-5.5"`)
	require.Contains(t, w.Body.String(), `"series"`)
	require.Contains(t, w.Body.String(), `"success_rate":75`)
	require.NotContains(t, w.Body.String(), `"request_count"`)
}

func TestGetPerfMetricsReturnsPerModelAvailability(t *testing.T) {
	setupPerfMetricsControllerTestDB(t)
	seedPerfMetric(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/perf-metrics?model=gpt-5.5&group=default&hours=24", nil)

	GetPerfMetrics(c)

	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"success":true`)
	require.Contains(t, w.Body.String(), `"model_name":"gpt-5.5"`)
	require.Contains(t, w.Body.String(), `"group":"default"`)
	require.Contains(t, w.Body.String(), `"success_rate":75`)
	require.Contains(t, w.Body.String(), `"avg_ttft_ms":400`)
	require.NotContains(t, w.Body.String(), `"request_count"`)
}

func TestGetPerfMetricsSummaryFiltersToUserSelectableGroups(t *testing.T) {
	setupPerfMetricsControllerTestDB(t)
	seedPerfMetricForGroup(t, "default", 1, 1)
	seedPerfMetricForGroup(t, "svip", 1, 0)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/perf-metrics/summary-series?hours=23", nil)

	GetPerfMetricsSummarySeries(c)

	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"model_name":"gpt-5.5"`)
	require.Contains(t, w.Body.String(), `"success_rate":100`)
	require.NotContains(t, w.Body.String(), `"success_rate":50`)
}

func TestGetPerfMetricsDetailFiltersToUserSelectableGroups(t *testing.T) {
	setupPerfMetricsControllerTestDB(t)
	seedPerfMetricForGroup(t, "default", 1, 1)
	seedPerfMetricForGroup(t, "svip", 1, 0)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/perf-metrics?model=gpt-5.5&hours=23", nil)

	GetPerfMetrics(c)

	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), `"group":"default"`)
	require.NotContains(t, w.Body.String(), `"group":"svip"`)
}
