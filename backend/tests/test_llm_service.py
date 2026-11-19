from unittest.mock import patch

import httpx
import pytest

from app.services.llm_service import LLMService


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


def test_provider_timeout_uses_deterministic_fallback():
    service = LLMService()
    service.api_key = "test-key"
    service.model = "test-model"

    with patch("app.services.llm_service.httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.post.side_effect = (
            httpx.TimeoutException("Simulated timeout")
        )

        result = service.invoke("Customer wants a product demo.")

    assert result["fallback_used"] is True
    assert result["llm_used"] is False
    assert "DEMO_INTEREST" in result["intent_tags"]
