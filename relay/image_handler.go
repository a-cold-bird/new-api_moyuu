package relay

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/model_setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
)

func ImageHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	info.InitChannelMeta(c)

	imageReq, ok := info.Request.(*dto.ImageRequest)
	if !ok {
		return types.NewErrorWithStatusCode(fmt.Errorf("invalid request type, expected dto.ImageRequest, got %T", info.Request), types.ErrorCodeInvalidRequest, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
	}

	request, err := common.DeepCopy(imageReq)
	if err != nil {
		return types.NewError(fmt.Errorf("failed to copy request to ImageRequest: %w", err), types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
	}

	err = helper.ModelMappedHelper(c, info, request)
	if err != nil {
		return types.NewError(err, types.ErrorCodeChannelModelMappedError, types.ErrOptionWithSkipRetry())
	}

	adaptor := GetAdaptor(info.ApiType)
	if adaptor == nil {
		return types.NewError(fmt.Errorf("invalid api type: %d", info.ApiType), types.ErrorCodeInvalidApiType, types.ErrOptionWithSkipRetry())
	}
	adaptor.Init(info)

	var requestBody io.Reader

	if model_setting.GetGlobalSettings().PassThroughRequestEnabled || info.ChannelSetting.PassThroughBodyEnabled {
		storage, err := common.GetBodyStorage(c)
		if err != nil {
			return types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
		}
		requestBody = common.ReaderOnly(storage)
	} else {
		convertedRequest, err := adaptor.ConvertImageRequest(c, info, *request)
		if err != nil {
			return types.NewError(err, types.ErrorCodeConvertRequestFailed)
		}
		relaycommon.AppendRequestConversionFromRequest(info, convertedRequest)

		switch convertedRequest.(type) {
		case *bytes.Buffer:
			requestBody = convertedRequest.(io.Reader)
		default:
			jsonData, err := common.Marshal(convertedRequest)
			if err != nil {
				return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
			}

			// apply param override
			if len(info.ParamOverride) > 0 {
				jsonData, err = relaycommon.ApplyParamOverrideWithRelayInfo(jsonData, info)
				if err != nil {
					return newAPIErrorFromParamOverride(err)
				}
			}

			if common.DebugEnabled {
				logger.LogDebug(c, fmt.Sprintf("image request body: %s", string(jsonData)))
			}
			requestBody = bytes.NewBuffer(jsonData)
		}
	}

	statusCodeMappingStr := c.GetString("status_code_mapping")

	generalSettings := operation_setting.GetGeneralSetting()
	keepAliveEnabled := generalSettings.ImageKeepAliveEnabled
	keepAliveInterval := generalSettings.ImageKeepAliveSeconds
	if keepAliveInterval < 5 {
		keepAliveInterval = 30
	}

	type doRequestResult struct {
		resp any
		err  error
	}
	resultCh := make(chan doRequestResult, 1)

	go func() {
		r, e := adaptor.DoRequest(c, info, requestBody)
		resultCh <- doRequestResult{resp: r, err: e}
	}()

	// If keep-alive enabled, immediately send headers and first byte
	// to reset CF's 120s Proxy Read Timeout, then heartbeat periodically.
	heartbeatStarted := false
	var result doRequestResult

	if keepAliveEnabled {
		heartbeatStarted = true
		c.Writer.Header().Set("Content-Type", "application/json")
		c.Writer.Header().Set("Transfer-Encoding", "chunked")
		c.Writer.Header().Set("X-Accel-Buffering", "no")
		c.Writer.Header().Set("Cache-Control", "no-cache, no-transform")
		c.Writer.WriteHeader(http.StatusOK)
		// Send a padding block to force proxies to flush immediately.
		_, _ = c.Writer.Write([]byte(" "))
		if flusher, ok := c.Writer.(http.Flusher); ok {
			flusher.Flush()
		}

		ticker := time.NewTicker(time.Duration(keepAliveInterval) * time.Second)
		defer ticker.Stop()
		for {
			select {
			case result = <-resultCh:
				ticker.Stop()
				goto doneWaiting
			case <-ticker.C:
				_, _ = c.Writer.Write([]byte(" "))
				if flusher, ok := c.Writer.(http.Flusher); ok {
					flusher.Flush()
				}
			}
		}
	} else {
		result = <-resultCh
	}
doneWaiting:

	resp := result.resp
	err = result.err

	if err != nil {
		if heartbeatStarted {
			errBody := fmt.Sprintf(`{"error":{"message":"%s","type":"upstream_error"}}`, err.Error())
			_, _ = c.Writer.Write([]byte(errBody))
			c.Writer.Flush()
			return nil
		}
		return types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}
	var httpResp *http.Response
	if resp != nil {
		httpResp = resp.(*http.Response)
		info.IsStream = info.IsStream || strings.HasPrefix(httpResp.Header.Get("Content-Type"), "text/event-stream")
		if httpResp.StatusCode != http.StatusOK {
			if httpResp.StatusCode == http.StatusCreated && info.ApiType == constant.APITypeReplicate {
				httpResp.StatusCode = http.StatusOK
			} else {
				newAPIError = service.RelayErrorHandler(c.Request.Context(), httpResp, false)
				service.ResetStatusCode(newAPIError, statusCodeMappingStr)
				if heartbeatStarted {
					errJSON, _ := common.Marshal(newAPIError)
					_, _ = c.Writer.Write(errJSON)
					c.Writer.Flush()
					return nil
				}
				return newAPIError
			}
		}
	}

	if heartbeatStarted {
		defer service.CloseResponseBodyGracefully(httpResp)
		responseBody, readErr := io.ReadAll(httpResp.Body)
		if readErr != nil {
			errBody := fmt.Sprintf(`{"error":{"message":"read upstream failed: %s","type":"proxy_error"}}`, readErr.Error())
			_, _ = c.Writer.Write([]byte(errBody))
			c.Writer.Flush()
			return nil
		}
		_, _ = c.Writer.Write(responseBody)
		c.Writer.Flush()

		var usageResp dto.SimpleResponse
		if parseErr := common.Unmarshal(responseBody, &usageResp); parseErr == nil {
			if usageResp.Usage.TotalTokens == 0 {
				usageResp.Usage.TotalTokens = 1
			}
			if usageResp.Usage.PromptTokens == 0 {
				usageResp.Usage.PromptTokens = 1
			}
			imageN := uint(1)
			if request.N != nil {
				imageN = *request.N
			}
			if _, hasN := info.PriceData.OtherRatios["n"]; !hasN {
				info.PriceData.AddOtherRatio("n", float64(imageN))
			}
			quality := "standard"
			if request.Quality == "hd" {
				quality = "hd"
			}
			var logContent []string
			if len(request.Size) > 0 {
				logContent = append(logContent, fmt.Sprintf("大小 %s", request.Size))
			}
			if len(quality) > 0 {
				logContent = append(logContent, fmt.Sprintf("品质 %s", quality))
			}
			if imageN > 0 {
				logContent = append(logContent, fmt.Sprintf("生成数量 %d", imageN))
			}
			service.PostTextConsumeQuota(c, info, &usageResp.Usage, logContent)
		}
		return nil
	}

	usage, newAPIError := adaptor.DoResponse(c, httpResp, info)
	if newAPIError != nil {
		service.ResetStatusCode(newAPIError, statusCodeMappingStr)
		return newAPIError
	}

	imageN := uint(1)
	if request.N != nil {
		imageN = *request.N
	}

	// n is handled via OtherRatio so it is applied exactly once in quota
	// calculation (both price-based and ratio-based paths).
	// Adaptors may have already set a more accurate count from the
	// upstream response; only set the default when they haven't.
	if _, hasN := info.PriceData.OtherRatios["n"]; !hasN {
		info.PriceData.AddOtherRatio("n", float64(imageN))
	}

	if usage.(*dto.Usage).TotalTokens == 0 {
		usage.(*dto.Usage).TotalTokens = 1
	}
	if usage.(*dto.Usage).PromptTokens == 0 {
		usage.(*dto.Usage).PromptTokens = 1
	}

	quality := "standard"
	if request.Quality == "hd" {
		quality = "hd"
	}

	var logContent []string

	if len(request.Size) > 0 {
		logContent = append(logContent, fmt.Sprintf("大小 %s", request.Size))
	}
	if len(quality) > 0 {
		logContent = append(logContent, fmt.Sprintf("品质 %s", quality))
	}
	if imageN > 0 {
		logContent = append(logContent, fmt.Sprintf("生成数量 %d", imageN))
	}

	service.PostTextConsumeQuota(c, info, usage.(*dto.Usage), logContent)
	return nil
}
