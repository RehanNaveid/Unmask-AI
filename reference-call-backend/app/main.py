from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from datetime import datetime
import logging
import requests
import json

from app.schemas import StartReferenceCallRequest
from app.elevenlabs_client import client
from app.supabase_client import supabase
from app.config import (
    AGENT_ID,
    PHONE_NUMBER_ID,
    ELEVENLABS_API_KEY,
    OPENROUTER_API_KEY
)

# ------------------------------------------------
# Logging
# ------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("reference-call")

# ------------------------------------------------
# App
# ------------------------------------------------
app = FastAPI(title="Reference Call Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://YOUR-FRONTEND.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# Health
# ------------------------------------------------
@app.get("/")
def health():
    return {"status": "ok"}

# ------------------------------------------------
# Helpers
# ------------------------------------------------
def trim_transcript(raw: dict, max_turns: int = 30) -> dict:
    turns = raw.get("turns", [])[:max_turns]
    cleaned = []

    for t in turns:
        role = t.get("role")
        message = t.get("message")
        if role and message:
            cleaned.append({
                "role": role,
                "message": message.strip()
            })

    return {
        "conversation_id": raw.get("conversation_id"),
        "turns": cleaned
    }

def transcript_to_text(trimmed: dict) -> str:
    return "\n".join(
        f"{t['role'].upper()}: {t['message']}"
        for t in trimmed["turns"]
    )

# ------------------------------------------------
# Start Reference Call
# ------------------------------------------------
@app.post("/api/reference-call")
def start_reference_call(payload: StartReferenceCallRequest):

    reference_call_id = str(uuid4())
    logger.info(f"CALL_INIT reference_call_id={reference_call_id}")

    supabase.table("reference_calls").insert({
        "id": reference_call_id,
        "candidate_id": str(payload.candidate_id),
        "reference_name": payload.reference_name,
        "reference_phone": payload.phone_number,
        "status": "calling"
    }).execute()

    try:
        call = client.conversational_ai.twilio.outbound_call(
            agent_id=AGENT_ID,
            agent_phone_number_id=PHONE_NUMBER_ID,
            to_number=payload.phone_number,
            conversation_initiation_client_data={
                "dynamic_variables": {
                    "candidate_name": payload.candidate_name,
                    "reference_name": payload.reference_name
                }
            }
        )
    except Exception as e:
        logger.error(f"CALL_FAILED {e}")
        supabase.table("reference_calls").update({
            "status": "failed"
        }).eq("id", reference_call_id).execute()
        raise HTTPException(502, "Failed to initiate call")

    supabase.table("reference_calls").update({
        "conversation_id": call.conversation_id,
        "call_started_at": datetime.utcnow().isoformat()
    }).eq("id", reference_call_id).execute()

    logger.info(
        f"CALL_STARTED reference_call_id={reference_call_id} "
        f"conversation_id={call.conversation_id}"
    )

    return {
        "reference_call_id": reference_call_id,
        "conversation_id": call.conversation_id
    }

# ------------------------------------------------
# Fetch Transcript (Explicit Pull)
# ------------------------------------------------
@app.post("/api/reference-call/{reference_call_id}/fetch-transcript")
def fetch_transcript(reference_call_id: str):

    res = supabase.table("reference_calls") \
        .select("conversation_id") \
        .eq("id", reference_call_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Reference call not found")

    conversation_id = res.data[0]["conversation_id"]

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Accept": "application/json"
    }

    resp = requests.get(
        f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}",
        headers=headers,
        timeout=20
    )

    if resp.status_code != 200:
        raise HTTPException(502, "Transcript not ready yet")

    raw = resp.json()
    if not raw.get("transcript"):
        return {"status": "not_ready"}

    trimmed = trim_transcript({
        "conversation_id": conversation_id,
        "turns": raw["transcript"]
    })

    existing = supabase.table("reference_call_results") \
        .select("id") \
        .eq("reference_call_id", reference_call_id) \
        .execute()

    if existing.data:
        return {"status": "already_fetched"}

    supabase.table("reference_call_results").insert({
        "reference_call_id": reference_call_id,
        "transcript": trimmed,
        "summary": {}  # NOT NULL SAFE
    }).execute()

    supabase.table("reference_calls").update({
        "status": "completed",
        "call_ended_at": datetime.utcnow().isoformat()
    }).eq("id", reference_call_id).execute()

    logger.info(f"TRANSCRIPT_SAVED reference_call_id={reference_call_id}")

    return {"status": "completed"}


@app.post("/api/reference-call/{reference_call_id}/generate-summary")
def generate_summary(reference_call_id: str):

    res = supabase.table("reference_call_results") \
        .select("transcript, summary") \
        .eq("reference_call_id", reference_call_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Transcript not found")

    row = res.data[0]

    if row["summary"]:
        return {
            "status": "already_generated",
            "summary": row["summary"]
        }

    transcript_text = transcript_to_text(row["transcript"])

    prompt = f"""
You are an HR analyst.

Analyze the following reference call transcript and write a clear,
professional evaluation covering:

- Overall sentiment of the reference
- Confirmation of employment and role
- Strengths mentioned
- Any concerns or hesitation
- Rehire eligibility
- Overall confidence in the reference

Write in plain English.
Do NOT return JSON.
Do NOT use bullet points excessively.
Keep it concise but professional.

Transcript:
{transcript_text}
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Reference Call Analyzer"
    }

    body = {
        "model": "openai/gpt-oss-120b:free",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 600
    }

    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=body,
        timeout=40
    )

    if resp.status_code != 200:
        logger.error(f"OPENROUTER_ERROR {resp.text}")
        raise HTTPException(502, "Summary generation failed")

    summary_text = resp.json()["choices"][0]["message"]["content"].strip()

    supabase.table("reference_call_results").update({
        "summary": summary_text
    }).eq("reference_call_id", reference_call_id).execute()

    logger.info(f"SUMMARY_GENERATED reference_call_id={reference_call_id}")

    return {
        "status": "generated",
        "summary": summary_text
    }
