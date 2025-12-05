import json

def normalize_json(text: str):
    """
    Extracts and safely parses JSON from an LLM response.
    Works even if the model adds extra text before/after the JSON.
    """
    try:
        # Trim whitespace
        text = text.strip()

        # If it's already valid JSON
        return json.loads(text)
    except:
        pass

    # Try to extract JSON block
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        json_str = text[start:end]
        return json.loads(json_str)
    except:
        return None


def validate_stage1_output(data: dict) -> bool:
    """
    Validates the JSON returned by Stage 1 models.
    Ensures required keys exist:
        - label
        - score
        - top_reasons
        - summary
    """
    REQUIRED = ["label", "score", "top_reasons", "summary"]

    if not isinstance(data, dict):
        return False

    for key in REQUIRED:
        if key not in data:
            return False

    # Score must be float 0–1
    try:
        s = float(data["score"])
        if s < 0 or s > 1:
            return False
    except:
        return False

    # Reasons should be list of strings
    if not isinstance(data["top_reasons"], list):
        return False

    return True
