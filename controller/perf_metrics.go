package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/model"
	perfmetrics "github.com/QuantumNous/new-api/pkg/perf_metrics"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

func GetPerfMetricsSummary(c *gin.Context) {
	hours := 24
	if rawHours := c.Query("hours"); rawHours != "" {
		if parsed, err := strconv.Atoi(rawHours); err == nil {
			hours = parsed
		}
	}

	activeGroups := getPerfMetricUserSelectableGroups(c)
	result, err := perfmetrics.QuerySummaryAll(hours, activeGroups)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

func GetPerfMetricsSummarySeries(c *gin.Context) {
	hours := 24
	if rawHours := c.Query("hours"); rawHours != "" {
		if parsed, err := strconv.Atoi(rawHours); err == nil {
			hours = parsed
		}
	}

	activeGroups := getPerfMetricUserSelectableGroups(c)
	result, err := perfmetrics.QuerySummarySeriesAll(hours, activeGroups)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

func GetPerfMetrics(c *gin.Context) {
	modelName := c.Query("model")
	if modelName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "model is required",
		})
		return
	}

	hours := 24
	if rawHours := c.Query("hours"); rawHours != "" {
		if parsed, err := strconv.Atoi(rawHours); err == nil {
			hours = parsed
		}
	}

	result, err := perfmetrics.Query(perfmetrics.QueryParams{
		Model: modelName,
		Group: c.Query("group"),
		Hours: hours,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	result.Groups = filterSelectableGroups(result.Groups, getPerfMetricUserSelectableGroups(c))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

func getPerfMetricUserSelectableGroups(c *gin.Context) []string {
	userGroup := ""
	if userId := c.GetInt("id"); userId != 0 {
		if user, err := model.GetUserCache(userId); err == nil {
			userGroup = user.Group
		}
	}

	usableGroups := service.GetUserUsableGroups(userGroup)
	activeRatios := ratio_setting.GetGroupRatioCopy()
	groups := make([]string, 0, len(activeRatios)+1)
	for group := range activeRatios {
		if _, ok := usableGroups[group]; ok {
			groups = append(groups, group)
		}
	}
	if _, ok := usableGroups["auto"]; ok {
		groups = append(groups, "auto")
	}
	return groups
}

func filterSelectableGroups(groups []perfmetrics.GroupResult, allowedGroups []string) []perfmetrics.GroupResult {
	allowed := lo.SliceToMap(allowedGroups, func(group string) (string, struct{}) {
		return group, struct{}{}
	})
	return lo.Filter(groups, func(g perfmetrics.GroupResult, _ int) bool {
		_, ok := allowed[g.Group]
		return ok
	})
}
