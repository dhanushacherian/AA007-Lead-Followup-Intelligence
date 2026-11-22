# OpenAI HTTP 429 Failure and Deterministic Fallback

**Project:** AA007 - Lead Follow-up Prioritization Intelligence
**Phase:** 2.3 - Controlled LLM Enhancement
**Record type:** Retrospective incident note
**Documentation date:** 2026-11-22

## 1. Observed provider failure

During development and testing, the configured OpenAI provider returned:

- HTTP status: 429
- Error type: insufficient_quota
- Reported reason: API credit balance exhausted

The original failure was observed during the project work. The raw provider response was not retained as a separate committed terminal log; this document is a retrospective record, not a reproduction of that log.

## 2. Deterministic fallback behavior

The application retained its deterministic fallback path when the provider could not complete the LLM request.

The existing backend tests verify fallback behavior for:
- Provider HTTP errors
- Provider timeouts
- Malformed provider responses

The tests verify that fallback is used, LLM usage is false, fallback status is reported, and supported deterministic intent tags can still be returned.

These tests establish generic provider-failure handling; they are not a replay of the original OpenAI 429 response.

## 3. Alternative provider integration

Following the OpenAI quota limitation, Gemini was integrated through the existing LLMService provider adapter.

The successful Gemini workflow evidence is recorded separately in:

- gemini-workflow-integration.txt
- llm-service-tests.txt
- phase2-3-final-tests.txt

The successful integration recorded:
- Provider: gemini
- Model: gemini-3.5-flash-lite
- LLM used: true
- Status: success
- Validation: passed
- Fallback used: false

The deterministic recommendation and LangGraph workflow routing remained authoritative.

## 4. Architecture boundary

The LLM is restricted to sales-note summarization and approved intent-tag extraction.

It does not calculate lead priority, change deterministic recommendations, override business rules, or control LangGraph routing.

Provider failures continue to use the deterministic fallback.

## 5. Evidence distinction

This note documents the observed OpenAI quota limitation and the subsequent engineering response. It does not claim to be the original API response capture.

The original provider-failure behavior and the later successful Gemini execution are supported by their respective implementation and test evidence.
