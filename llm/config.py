"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = "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"

COUNCIL_MODELS = [
    "tngtech/deepseek-r1t2-chimera:free",
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "z-ai/glm-4.5-air:free"     # Multimodal variety
]
CHAIRMAN_MODEL = "meta-llama/llama-3.3-70b-instruct:free"# Reliable synthesis

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"
