package common

import (
	"strings"
	"testing"
)

func TestMaskSensitiveInfo_AnthropicRateLimit(t *testing.T) {
	input := `status_code=400, This request would exceed your organization's rate limit of 500,000 input tokens per minute (org: bc15ef74-8ac2-460a-a5d4-72ef498dedbd, model: claude-opus-4-7). For details, refer to: https://docs.anthropic.com/en/api/rate-limits You can see the response headers for current usage. Please reduce the prompt length or the maximum tokens requested, or try again later. You may also contact sales at https://www.anthropic.com/contact-sales to discuss your options for a rate limit increase. (request id: 20260518193824556446097BtuF)`

	got := MaskSensitiveInfo(input)
	t.Logf("input:  %s", input)
	t.Logf("output: %s", got)

	mustNotContain := []string{
		"500,000",                                // quota number
		"bc15ef74-8ac2-460a-a5d4-72ef498dedbd",   // org UUID
		"20260518193824556446097BtuF",            // request id payload
		"docs.anthropic.com",                     // URL host
		"www.anthropic.com",                      // URL host
	}
	for _, s := range mustNotContain {
		if strings.Contains(got, s) {
			t.Errorf("sensitive token leaked: %q\noutput: %s", s, got)
		}
	}

	mustContain := []string{
		"rate limit",      // semantic preserved
		"claude-opus-4-7", // model name OK to leak
	}
	for _, s := range mustContain {
		if !strings.Contains(got, s) {
			t.Errorf("expected substring missing: %q\noutput: %s", s, got)
		}
	}
}

func TestMaskSensitiveInfo_OpenAIQuotaExceeded(t *testing.T) {
	input := `You exceeded your current quota, please check your plan and billing details at https://platform.openai.com/account/billing. (org: org-AbC123dEf456GhI789jKl)`

	got := MaskSensitiveInfo(input)
	t.Logf("input:  %s", input)
	t.Logf("output: %s", got)

	if strings.Contains(got, "org-AbC123dEf456GhI789jKl") {
		t.Errorf("org id leaked: %s", got)
	}
	if strings.Contains(got, "platform.openai.com") {
		t.Errorf("URL host leaked: %s", got)
	}
}

func TestMaskSensitiveInfo_TierLeak(t *testing.T) {
	input := `Your account is on Tier 4 and has exceeded the daily limit of $500 spent.`

	got := MaskSensitiveInfo(input)
	t.Logf("output: %s", got)

	if strings.Contains(got, "Tier 4") {
		t.Errorf("tier number leaked: %s", got)
	}
	if strings.Contains(got, "$500") {
		t.Errorf("currency leaked: %s", got)
	}
}

func TestMaskSensitiveInfo_NoFalsePositive(t *testing.T) {
	input := `claude-opus-4-7 has a rate limit. Please retry.`

	got := MaskSensitiveInfo(input)
	t.Logf("output: %s", got)

	if !strings.Contains(got, "claude-opus-4-7") {
		t.Errorf("model name wrongly masked: %s", got)
	}
	if !strings.Contains(got, "rate limit") {
		t.Errorf("normal phrase wrongly masked: %s", got)
	}
}
