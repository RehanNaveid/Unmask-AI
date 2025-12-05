"""FastAPI backend for LLM Council."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid
import json
import asyncio

from . import storage
# Updated imports — ONLY the functions that exist
from .council import (
    run_full_council,
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final
)

app = FastAPI(title="LLM Council API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
#  Models
# -----------------------------

class CreateConversationRequest(BaseModel):
    pass

class SendMessageRequest(BaseModel):
    content: str

class AnalyzeRequest(BaseModel):
    cv_json: Dict[str, Any]
    linkedin_json: Dict[str, Any]
    github_json: Dict[str, Any]

class ConversationMetadata(BaseModel):
    id: str
    created_at: str
    title: str
    message_count: int

class Conversation(BaseModel):
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]

# -----------------------------
#  Health Check
# -----------------------------

@app.get("/")
async def root():
    return {"status": "ok", "service": "LLM Council API"}

# -----------------------------
#  Candidate Analysis API
# -----------------------------

@app.post("/api/analyze")
async def analyze_candidate(request: AnalyzeRequest):
    """
    Run full candidate analysis (CV, LinkedIn, GitHub) using the 3-stage council pipeline.
    """
    user_query = f"""
You are a credibility-checking assistant for hiring.

Structured data for this candidate:

CV JSON:
{json.dumps(request.cv_json, ensure_ascii=False)}

LinkedIn JSON:
{json.dumps(request.linkedin_json, ensure_ascii=False)}

GitHub JSON:
{json.dumps(request.github_json, ensure_ascii=False)}

Task:
1. Assess authenticity & consistency.
2. Highlight red/yellow flags.
3. Suggest follow-up questions for the interview.

Return your best analysis.
"""

    stage1, stage2, stage3, metadata = await run_full_council(user_query)

    return {
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3,
        "metadata": metadata,
    }

# -----------------------------
#  Conversation System (Optional Chat UI)
# -----------------------------

@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations():
    return storage.list_conversations()

@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(request: CreateConversationRequest):
    conversation_id = str(uuid.uuid4())
    conv = storage.create_conversation(conversation_id)
    return conv

@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    conv = storage.get_conversation(conversation_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: str, request: SendMessageRequest):
    """
    Add a message → run council → store results.
    """
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Store user message
    storage.add_user_message(conversation_id, request.content)

    # Run council
    stage1, stage2, stage3, metadata = await run_full_council(request.content)

    # Store assistant response
    storage.add_assistant_message(conversation_id, stage1, stage2, stage3)

    return {
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3,
        "metadata": metadata
    }

# -----------------------------
#  Streaming Version (SSE)
# -----------------------------

@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(conversation_id: str, request: SendMessageRequest):
    """
    Streaming version of council evaluation (SSE).
    """
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    async def event_generator():
        try:
            # Store user message
            storage.add_user_message(conversation_id, request.content)

            # STAGE 1
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1 = await stage1_collect_responses(request.content)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1})}\n\n"

            # STAGE 2
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2, label_map = await stage2_collect_rankings(request.content, stage1)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2, 'metadata': {'label_to_model': label_map}})}\n\n"

            # STAGE 3
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3 = await stage3_synthesize_final(request.content, stage1, stage2)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3})}\n\n"

            # Save conversation state
            storage.add_assistant_message(conversation_id, stage1, stage2, stage3)

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )

# -----------------------------
#  Run Server
# -----------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
