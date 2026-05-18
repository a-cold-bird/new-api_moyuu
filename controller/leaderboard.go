package controller

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

const (
	leaderboardCacheTTL = 30 * time.Second
	siteStatsCacheTTL   = 5 * time.Minute
)

func getTimestampRange(period string) (int64, int64) {
	now := time.Now().Unix()
	switch period {
	case "24h":
		return now - 86400, now
	case "7d":
		return now - 7*86400, now
	case "30d":
		return now - 30*86400, now
	default:
		return 0, now
	}
}

func cachedJSON(c *gin.Context, cacheKey string, ttl time.Duration, fetch func() (any, error)) {
	if common.RedisEnabled {
		cached, err := common.RedisGet(cacheKey)
		if err == nil && cached != "" {
			c.Data(http.StatusOK, "application/json", []byte(cached))
			return
		}
	}

	data, err := fetch()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	body, _ := common.Marshal(gin.H{"success": true, "message": "", "data": data})

	if common.RedisEnabled {
		_ = common.RedisSet(cacheKey, string(body), ttl)
	}

	c.Data(http.StatusOK, "application/json", body)
}

func GetLeaderboard(c *gin.Context) {
	gs := operation_setting.GetGeneralSetting()
	if !gs.LeaderboardEnabled {
		common.ApiError(c, errors.New("排行榜未启用"))
		return
	}

	period := c.DefaultQuery("period", "24h")
	tab := c.DefaultQuery("tab", "users")
	if tab != "users" && tab != "models" {
		tab = "users"
	}
	cacheKey := fmt.Sprintf("leaderboard:%s:%s", tab, period)
	startTs, endTs := getTimestampRange(period)

	cachedJSON(c, cacheKey, leaderboardCacheTTL, func() (any, error) {
		if tab == "models" {
			return model.GetModelLeaderboard(startTs, endTs, 100)
		}
		return model.GetUserLeaderboard(startTs, endTs, 100)
	})
}

func GetMyRank(c *gin.Context) {
	gs := operation_setting.GetGeneralSetting()
	if !gs.LeaderboardEnabled {
		common.ApiError(c, errors.New("排行榜未启用"))
		return
	}

	userId := c.GetInt("id")
	period := c.DefaultQuery("period", "24h")
	startTs, endTs := getTimestampRange(period)

	entry, err := model.GetUserRank(userId, startTs, endTs)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    entry,
	})
}

func GetSiteStats(c *gin.Context) {
	cachedJSON(c, "site:stats", siteStatsCacheTTL, func() (any, error) {
		return model.GetSiteStats()
	})
}
