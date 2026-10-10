import os
import json
import re
import logging
from typing import Optional, Dict, Any, Type
from pydantic import BaseModel
from config import settings

logger = logging.getLogger("blindspot.llm_client")
logging.basicConfig(level=logging.INFO)

class LLMClient:
    """
    Provider-agnostic LLM client with Gemini API integration,
    automatic markdown stripping, JSON schema repair loop (up to 2 retries),
    and a robust DEMO_MODE fallback system for hackathon zero-latency resilience.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.demo_mode = settings.DEMO_MODE or not bool(self.api_key)
        self.gemini_client = None
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.gemini_client = genai.GenerativeModel(self.model_name)
                logger.info(f"Initialized Gemini model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to configure Gemini client ({e}). Falling back to DEMO_MODE.")
                self.demo_mode = True
        else:
            logger.info("No GEMINI_API_KEY provided. Running in high-fidelity DEMO_MODE.")

    def _clean_json_string(self, text: str) -> str:
        """Strip markdown ticks and isolate outer JSON structure."""
        text = text.strip()
        # Remove ```json and ```
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Regex search for outermost {...} or [...]
        match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if match:
            text = match.group(1)
        return text

    def generate_json(self, prompt: str, schema: Optional[Type[BaseModel]] = None, mock_fallback: Optional[Any] = None, max_retries: int = 2) -> Any:
        """
        Generate JSON output validated against Pydantic schema or python dict.
        Includes automatic retry-and-repair for broken LLM responses.
        """
        if self.demo_mode or not self.gemini_client:
            logger.info("DEMO_MODE active: Returning high-fidelity mock fallback.")
            return mock_fallback if mock_fallback is not None else {}

        current_prompt = prompt
        schema_instruction = ""
        if schema:
            schema_instruction = f"\n\nReturn strictly valid JSON matching this schema: {json.dumps(schema.model_json_schema())}. Do NOT include any explanations outside the JSON."
            current_prompt += schema_instruction

        for attempt in range(max_retries + 1):
            try:
                logger.info(f"LLM call attempt {attempt + 1}")
                response = self.gemini_client.generate_content(current_prompt)
                raw_text = response.text
                cleaned = self._clean_json_string(raw_text)
                parsed = json.loads(cleaned)

                if schema:
                    validated = schema.model_validate(parsed)
                    return validated.model_dump()
                return parsed

            except Exception as e:
                logger.warning(f"LLM JSON generation attempt {attempt + 1} failed: {e}")
                if attempt < max_retries:
                    current_prompt = (
                        f"Your previous response was invalid JSON or did not conform to the schema: {e}\n"
                        f"Original Prompt:\n{prompt}\n\n"
                        f"Please output ONLY strictly valid, parseable JSON."
                    )
                else:
                    logger.error(f"Exhausted {max_retries} LLM retries. Falling back to mock response.")
                    return mock_fallback if mock_fallback is not None else {}

    def generate_text(self, prompt: str, mock_fallback: str = "") -> str:
        """Generate open-ended text with fallback."""
        if self.demo_mode or not self.gemini_client:
            return mock_fallback
        try:
            response = self.gemini_client.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.warning(f"LLM text generation failed: {e}. Falling back.")
            return mock_fallback

# Global singleton
llm_client = LLMClient()
