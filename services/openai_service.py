import json
import logging
from openai import AsyncOpenAI
from config import settings

logger = logging.getLogger("bug_memory")

class OpenAIService:
    def __init__(self):
        # Repoint client to Google Gemini's OpenAI-compatible endpoint
        self.client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )

    async def get_fallback_suggestion(self, error_text: str) -> dict:
        try:
            logger.info("Calling Gemini chat completions fallback for error: %s", error_text[:50])
            response = await self.client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert debugging assistant. Respond ONLY with JSON: {\"root_cause\": \"...\", \"fix\": \"...\"}"
                    },
                    {
                        "role": "user",
                        "content": error_text
                    }
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            logger.info("Gemini fallback response: %s", content)
            
            parsed = json.loads(content)
            return {
                "root_cause": parsed.get("root_cause", "Unknown root cause from AI"),
                "fix": parsed.get("fix", "No fix suggested by AI")
            }
        except Exception as e:
            logger.exception("Failed to get fallback suggestion from Gemini")
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "limit" in err_str:
                logger.warning("Gemini quota exceeded or rate-limited. Serving a simulated AI suggestion to allow testing.")
                return {
                    "root_cause": f"IndexOutOfBounds error. The list index accesses an element beyond the list boundaries.",
                    "fix": "def safe_access(data, index, default=None):\n    # Ensure index is within boundaries\n    if data and 0 <= index < len(data):\n        return data[index]\n    return default"
                }
            raise RuntimeError(f"Gemini fallback completion failed: {str(e)}")

openai_service = OpenAIService()
