package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func withHeaderNavModules(t *testing.T, value string) {
	t.Helper()
	common.OptionMapRWMutex.Lock()
	if common.OptionMap == nil {
		common.OptionMap = map[string]string{}
	}
	oldValue, hadOldValue := common.OptionMap["HeaderNavModules"]
	common.OptionMap["HeaderNavModules"] = value
	common.OptionMapRWMutex.Unlock()

	t.Cleanup(func() {
		common.OptionMapRWMutex.Lock()
		if hadOldValue {
			common.OptionMap["HeaderNavModules"] = oldValue
		} else {
			delete(common.OptionMap, "HeaderNavModules")
		}
		common.OptionMapRWMutex.Unlock()
	})
}

func TestGetHeaderNavAccessSupportsPricingObject(t *testing.T) {
	withHeaderNavModules(t, `{"pricing":{"enabled":true,"requireAuth":true}}`)

	access := getHeaderNavAccess("pricing")

	require.True(t, access.Enabled)
	require.True(t, access.RequireAuth)
}

func TestGetHeaderNavAccessSupportsBooleanCompatibility(t *testing.T) {
	withHeaderNavModules(t, `{"pricing":false}`)

	access := getHeaderNavAccess("pricing")

	require.False(t, access.Enabled)
	require.False(t, access.RequireAuth)
}

func TestGetHeaderNavAccessFallsBackToPublicEnabled(t *testing.T) {
	withHeaderNavModules(t, ``)

	access := getHeaderNavAccess("pricing")

	require.True(t, access.Enabled)
	require.False(t, access.RequireAuth)
}

func TestHeaderNavModulePublicOrUserAuthRejectsDisabledModule(t *testing.T) {
	withHeaderNavModules(t, `{"pricing":false}`)
	g := gin.New()
	g.GET("/perf", HeaderNavModulePublicOrUserAuth("pricing"), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/perf", nil)
	g.ServeHTTP(w, req)

	require.Equal(t, http.StatusForbidden, w.Code)
}
