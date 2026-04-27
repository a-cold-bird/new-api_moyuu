package model

import (
	"unicode/utf8"
)

type LeaderboardUserEntry struct {
	UserId       int    `json:"-"`
	Username     string `json:"username"`
	TotalQuota   int64  `json:"total_quota"`
	TotalTokens  int64  `json:"total_tokens"`
	RequestCount int64  `json:"request_count"`
}

type LeaderboardModelEntry struct {
	ModelName    string `json:"model_name"`
	TotalQuota   int64  `json:"total_quota"`
	TotalTokens  int64  `json:"total_tokens"`
	RequestCount int64  `json:"request_count"`
}

type LeaderboardSelfEntry struct {
	Rank         int64  `json:"rank"`
	TotalQuota   int64  `json:"total_quota"`
	TotalTokens  int64  `json:"total_tokens"`
	RequestCount int64  `json:"request_count"`
}

func MaskUsername(name string) string {
	runeCount := utf8.RuneCountInString(name)
	if runeCount <= 4 {
		runes := []rune(name)
		if runeCount <= 2 {
			return string(runes[:1]) + "***"
		}
		return string(runes[:1]) + "***" + string(runes[runeCount-1:])
	}
	runes := []rune(name)
	return string(runes[:2]) + "***" + string(runes[runeCount-2:])
}

func GetUserLeaderboard(startTimestamp, endTimestamp int64, limit int) ([]*LeaderboardUserEntry, error) {
	if limit <= 0 || limit > 100 {
		limit = 100
	}

	var entries []*LeaderboardUserEntry
	tx := LOG_DB.Table("logs").
		Select("user_id, username, SUM(quota) as total_quota, SUM(prompt_tokens + completion_tokens) as total_tokens, COUNT(*) as request_count").
		Where("type = ?", LogTypeConsume)

	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}

	err := tx.Group("user_id, username").
		Order("total_quota DESC").
		Limit(limit).
		Find(&entries).Error

	if err != nil {
		return nil, err
	}

	for _, e := range entries {
		e.Username = MaskUsername(e.Username)
	}

	return entries, nil
}

func GetModelLeaderboard(startTimestamp, endTimestamp int64, limit int) ([]*LeaderboardModelEntry, error) {
	if limit <= 0 || limit > 100 {
		limit = 100
	}

	var entries []*LeaderboardModelEntry
	tx := LOG_DB.Table("logs").
		Select("model_name, SUM(quota) as total_quota, SUM(prompt_tokens + completion_tokens) as total_tokens, COUNT(*) as request_count").
		Where("type = ?", LogTypeConsume)

	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}

	err := tx.Group("model_name").
		Order("total_quota DESC").
		Limit(limit).
		Find(&entries).Error

	return entries, err
}

func GetUserRank(userId int, startTimestamp, endTimestamp int64) (*LeaderboardSelfEntry, error) {
	var userStats struct {
		TotalQuota   int64 `json:"total_quota"`
		TotalTokens  int64 `json:"total_tokens"`
		RequestCount int64 `json:"request_count"`
	}

	tx := LOG_DB.Table("logs").
		Select("SUM(quota) as total_quota, SUM(prompt_tokens + completion_tokens) as total_tokens, COUNT(*) as request_count").
		Where("type = ? AND user_id = ?", LogTypeConsume, userId)

	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}

	if err := tx.Scan(&userStats).Error; err != nil {
		return nil, err
	}

	var rank int64
	rankTx := LOG_DB.Table("logs").
		Select("COUNT(DISTINCT user_id)").
		Where("type = ?", LogTypeConsume)

	if startTimestamp > 0 {
		rankTx = rankTx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		rankTx = rankTx.Where("created_at <= ?", endTimestamp)
	}

	subQuery := LOG_DB.Table("logs").
		Select("SUM(quota)").
		Where("type = ?", LogTypeConsume)

	if startTimestamp > 0 {
		subQuery = subQuery.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		subQuery = subQuery.Where("created_at <= ?", endTimestamp)
	}

	rankTx = rankTx.Where("user_id IN (?)",
		LOG_DB.Table("logs").
			Select("user_id").
			Where("type = ?", LogTypeConsume).
			Group("user_id").
			Having("SUM(quota) > ?", userStats.TotalQuota))

	if startTimestamp > 0 {
		rankTx = rankTx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		rankTx = rankTx.Where("created_at <= ?", endTimestamp)
	}

	if err := rankTx.Scan(&rank).Error; err != nil {
		return nil, err
	}

	return &LeaderboardSelfEntry{
		Rank:         rank + 1,
		TotalQuota:   userStats.TotalQuota,
		TotalTokens:  userStats.TotalTokens,
		RequestCount: userStats.RequestCount,
	}, nil
}

type SiteStats struct {
	TotalUsers  int64 `json:"total_users"`
	TotalTokens int64 `json:"total_tokens"`
}

func GetSiteStats() (*SiteStats, error) {
	var stats SiteStats

	if err := DB.Table("users").Where("status = ?", 1).Count(&stats.TotalUsers).Error; err != nil {
		return nil, err
	}

	if err := LOG_DB.Table("logs").
		Select("COALESCE(SUM(prompt_tokens + completion_tokens), 0) as total_tokens").
		Where("type = ?", LogTypeConsume).
		Scan(&stats).Error; err != nil {
		return nil, err
	}

	return &stats, nil
}
