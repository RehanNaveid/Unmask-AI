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
    "openai/gpt-oss-120b:free",
    "openrouter/free",
    "openai/gpt-oss-20b:free"
]

CHAIRMAN_MODEL = "openai/gpt-oss-120b:free"

MAX_RETRIES = 3
# --- API Endpoints ---
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# --- Storage ---
DATA_DIR = "data/conversations"
