from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

# --- API Keys ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError(
        "❌ ERROR: OPENROUTER_API_KEY is not set. Add it to your .env file."
    )

# --- LLM Models ---
COUNCIL_MODELS = [
    "mistralai/devstral-2512:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "nex-agi/deepseek-v3.1-nex-n1:free"
]

CHAIRMAN_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

# --- API Endpoints ---
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# --- Storage ---
DATA_DIR = "data/conversations"
