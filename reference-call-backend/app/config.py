import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env explicitly
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AGENT_ID = os.getenv("AGENT_ID")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
ELEVENLABS_WEBHOOK_SECRET = os.getenv("ELEVENLABS_WEBHOOK_SECRET")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

missing = [
    name for name, value in {
        "ELEVENLABS_API_KEY": ELEVENLABS_API_KEY,
        "AGENT_ID": AGENT_ID,
        "PHONE_NUMBER_ID": PHONE_NUMBER_ID,
        "OPENROUTER_API_KEY": OPENROUTER_API_KEY,
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_SERVICE_KEY": SUPABASE_SERVICE_KEY,
    }.items()
    if not value
]

if missing:
    raise RuntimeError(f"Missing required environment variables: {missing}")
