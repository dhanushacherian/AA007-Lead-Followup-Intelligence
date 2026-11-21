import json
from unittest.mock import patch

import httpx
import pytest

from app.services.llm_service import LLMService


def configured_service():
    service = LLMService()
    service.api_key = "test-key"
    service.model = "test-model"
    service.provider = "openai"
    return service


def mocked_provider_response(content):
    response = type("MockResponse", (), {})()
    response.raise_for_status = lambda: None
    response.json = lambda: {
        "choices": [
            {
                "message": {
                    "content": content
                }
            }
        ]
    }

    return response


def test_fallback_extracts_supported_intent_tags():
    service = LLMService()
    service.api_key = ""
    service.model = ""

    result = service.invoke(
        "Customer wants a product demo and pricing next month."
    )

    assert result["fallback_used"] is True
    assert result["llm_used"] is False
    assert "DEMO_INTEREST" in result["intent_tags"]
    assert "PRICING_INTEREST" in result["intent_tags"]
    assert "FUTURE_DECISION" in result["intent_tags"]


def test_empty_notes_use_unclear_fallback():
    service = LLMService()

    result = service.invoke("")

    assert result["fallback_used"] is True
    assert result["intent_tags"] == ["UNCLEAR"]


def test_ambiguous_notes_use_unclear_fallback():
    service = LLMService()
    service.api_key = ""
    service.model = ""

    result = service.invoke(
        "We had a brief conversation. No clear requirement was recorded."
    )

    assert result["fallback_used"] is True
    assert result["intent_tags"] == ["UNCLEAR"]


def test_domain_specific_notes_extract_multiple_supported_tags():
    service = LLMService()
    service.api_key = ""
    service.model = ""

    result = service.invoke(
        "Customer asked about product features, pricing, "
        "and a demo before deciding next quarter."
    )

    assert result["fallback_used"] is True
    assert "PRODUCT_INTEREST" in result["intent_tags"]
    assert "PRICING_INTEREST" in result["intent_tags"]
    assert "DEMO_INTEREST" in result["intent_tags"]
    assert "FUTURE_DECISION" in result["intent_tags"]


def test_valid_structured_output_is_accepted():
    service = LLMService()

    result = service.validate_output({
        "summary": "Customer is interested in a product demo.",
        "intent_tags": ["DEMO_INTEREST"],
    })

    assert result["summary"] == "Customer is interested in a product demo."
    assert result["intent_tags"] == ["DEMO_INTEREST"]


def test_invalid_intent_tag_is_rejected():
    service = LLMService()

    with pytest.raises(ValueError):
        service.validate_output({
            "summary": "Unsupported intent.",
            "intent_tags": ["UNSUPPORTED_TAG"],
        })


def test_valid_mocked_provider_response_is_accepted():
    service = configured_service()

    content = json.dumps({
        "summary": "Customer requested a product demonstration.",
        "intent_tags": ["DEMO_INTEREST"],
    })

    with patch("app.services.llm_service.httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.post.return_value = (
            mocked_provider_response(content)
        )

        result = service.invoke("Customer wants a product demo.")

    assert result["llm_used"] is True
    assert result["fallback_used"] is False
    assert result["status"] == "success"
    assert result["validation_status"] == "passed"
    assert result["intent_tags"] == ["DEMO_INTEREST"]


def test_malformed_provider_json_uses_deterministic_fallback():
    service = configured_service()

    with patch("app.services.llm_service.httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.post.return_value = (
            mocked_provider_response("{invalid-json")
        )

        result = service.invoke("Customer wants a product demo.")

    assert result["fallback_used"] is True
    assert result["llm_used"] is False
    assert result["status"] == "fallback"
    assert "DEMO_INTEREST" in result["intent_tags"]


def test_provider_timeout_uses_deterministic_fallback():
    service = configured_service()

    with patch("app.services.llm_service.httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.post.side_effect = (
            httpx.TimeoutException("Simulated timeout")
        )

        result = service.invoke("Customer wants a product demo.")

    assert result["fallback_used"] is True
    assert result["llm_used"] is False
    assert "DEMO_INTEREST" in result["intent_tags"]


def test_provider_http_error_uses_deterministic_fallback():
    service = configured_service()

    request = httpx.Request(
        "POST",
        "https://api.openai.com/v1/chat/completions",
    )
    response = httpx.Response(
        503,
        request=request,
    )
    provider_error = httpx.HTTPStatusError(
        "Simulated provider error",
        request=request,
        response=response,
    )

    mock_response = mocked_provider_response("{}")
    mock_response.raise_for_status = lambda: (_ for _ in ()).throw(
        provider_error
    )

    with patch("app.services.llm_service.httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.post.return_value = (
            mock_response
        )

        result = service.invoke("Customer wants a product demo.")

    assert result["fallback_used"] is True
    assert result["llm_used"] is False
    assert result["status"] == "fallback"
    assert "DEMO_INTEREST" in result["intent_tags"]
