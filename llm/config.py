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
    "stepfun/step-3.5-flash:free",
    "arcee-ai/trinity-mini:free",
    "nvidia/nemotron-nano-12b-v2-vl:free"
]

CHAIRMAN_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"

# --- API Endpoints ---
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# --- Storage ---
DATA_DIR = "data/conversations"
