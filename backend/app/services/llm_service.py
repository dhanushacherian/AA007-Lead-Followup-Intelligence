import json
import os
from typing import Any

import httpx


class LLMService:
    """Optional sales-note summarization adapter with provider support."""

    ALLOWED_TAGS = {
        "DEMO_INTEREST",
        "PRICING_INTEREST",
        "FUTURE_DECISION",
        "PRODUCT_INTEREST",
        "UNCLEAR",
    }

    MAX_NOTES_LENGTH = 4000
    MAX_SUMMARY_LENGTH = 500

    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
        self.model = os.getenv("LLM_MODEL", "").strip()
        self.api_key = os.getenv("LLM_API_KEY", "").strip()
        self.timeout = float(os.getenv("LLM_TIMEOUT", "10"))

    def fallback(self, notes: str) -> dict[str, Any]:
        text = notes.lower()
        tags = []

        if "demo" in text:
            tags.append("DEMO_INTEREST")
        if any(word in text for word in ("price", "pricing", "cost")):
            tags.append("PRICING_INTEREST")
        if any(word in text for word in ("later", "next month", "next quarter")):
            tags.append("FUTURE_DECISION")
        if any(word in text for word in ("product", "feature")):
            tags.append("PRODUCT_INTEREST")

        if not tags:
            tags.append("UNCLEAR")

        return {
            "summary": "Sales-note summary generated using deterministic fallback.",
            "intent_tags": tags,
            "llm_used": False,
            "provider": self.provider,
            "model": self.model or "not_configured",
            "status": "fallback",
            "fallback_used": True,
            "validation_status": "not_applicable",
        }

    def build_prompt(self, notes: str) -> list[dict[str, str]]:
        return [
            {
                "role": "system",
                "content": (
                    "Summarize the supplied sales notes. Extract only "
                    "non-sensitive intent. Do not infer facts or invent "
                    "details. Return JSON only with exactly two fields: "
                    "summary (string, maximum 500 characters) and "
                    "intent_tags (array of allowed strings). "
                    f"Allowed tags: {', '.join(sorted(self.ALLOWED_TAGS))}. "
                    "Use UNCLEAR when no supported intent is present."
                ),
            },
            {"role": "user", "content": notes},
        ]

    def validate_output(self, data: Any) -> dict[str, Any]:
        if not isinstance(data, dict):
            raise ValueError("LLM response must be a JSON object.")

        if set(data) != {"summary", "intent_tags"}:
            raise ValueError("Unexpected LLM response fields.")

        summary = data["summary"]
        tags = data["intent_tags"]

        if not isinstance(summary, str) or not summary.strip():
            raise ValueError("Summary must be a non-empty string.")

        if len(summary) > self.MAX_SUMMARY_LENGTH:
            raise ValueError("Summary exceeds the permitted length.")

        if (
            not isinstance(tags, list)
            or not tags
            or len(tags) > len(self.ALLOWED_TAGS)
            or any(
                not isinstance(tag, str) or tag not in self.ALLOWED_TAGS
                for tag in tags
            )
        ):
            raise ValueError("Invalid intent tags.")

        return {
            "summary": summary.strip(),
            "intent_tags": sorted(set(tags)),
        }

    def _call_openai(self, notes: str) -> Any:
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": self.build_prompt(notes),
                    "response_format": {"type": "json_object"},
                    "temperature": 0,
                },
            )
            response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]
        return json.loads(content)

    def _call_gemini(self, notes: str) -> Any:
        prompt = self.build_prompt(notes)

        system_instruction = prompt[0]["content"]
        user_content = prompt[1]["content"]

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent"
        )

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                url,
                headers={
                    "x-goog-api-key": self.api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "systemInstruction": {
                        "parts": [{"text": system_instruction}]
                    },
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": user_content}],
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0,
                        "responseMimeType": "application/json",
                    },
                },
            )
            response.raise_for_status()

        content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(content)

    def invoke(self, notes: str) -> dict[str, Any]:
        if not notes or not notes.strip():
            return self.fallback("")

        notes = notes.strip()[:self.MAX_NOTES_LENGTH]

        if not self.api_key or not self.model:
            return self.fallback(notes)

        try:
            if self.provider == "openai":
                raw_output = self._call_openai(notes)
            elif self.provider == "gemini":
                raw_output = self._call_gemini(notes)
            else:
                return self.fallback(notes)

            validated = self.validate_output(raw_output)

            return {
                **validated,
                "llm_used": True,
                "provider": self.provider,
                "model": self.model,
                "status": "success",
                "fallback_used": False,
                "validation_status": "passed",
            }

        except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError):
            return self.fallback(notes)


llm_service = LLMService()
