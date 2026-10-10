import pytest
from pydantic import BaseModel
from services.llm_client import LLMClient

class SampleSchema(BaseModel):
    name: str
    score: int

def test_json_cleaner_strips_markdown_codeblocks():
    client = LLMClient()
    raw_markdown = "```json\n{\"name\": \"Deadlock\", \"score\": 85}\n```"
    cleaned = client._clean_json_string(raw_markdown)
    assert cleaned == "{\"name\": \"Deadlock\", \"score\": 85}"

def test_json_cleaner_strips_extraneous_text():
    client = LLMClient()
    raw_with_prose = "Here is your requested JSON schema output:\n```\n{\"name\": \"Lock\", \"score\": 90}\n```\nHope this helps!"
    cleaned = client._clean_json_string(raw_with_prose)
    assert cleaned == "{\"name\": \"Lock\", \"score\": 90}"

def test_demo_mode_fallback():
    client = LLMClient()
    client.demo_mode = True
    mock = {"name": "Demo Topic", "score": 100}
    res = client.generate_json("Generate topic", mock_fallback=mock)
    assert res["name"] == "Demo Topic"
    assert res["score"] == 100
