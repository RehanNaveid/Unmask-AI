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
from .council import (
    run_full_council,
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final,
)

app = FastAPI(title="LLM Council API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
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

    cv = request.cv_json or {}
    li = request.linkedin_json or {}
    gh = request.github_json or {}

    # CV projects parsed on Java side
    cv_projects: List[Dict[str, Any]] = cv.get("projects", []) or []

    # GitHub summary fields populated by Java GithubService/FactSheetService
    github_profile = gh.get("profile", {}) or {}
    github_repos: List[Dict[str, Any]] = gh.get("repositories", []) or []
    repo_count = gh.get("repo_count", len(github_repos))
    language_hist = gh.get("language_histogram", {}) or {}

    # Compact repo summaries for the prompt (keep token usage low)
    top_repo_summaries: List[Dict[str, Any]] = []
    for repo in github_repos[:5]:
        top_repo_summaries.append(
            {
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "description": repo.get("description"),
                "language": repo.get("language"),
                "pushed_at": repo.get("pushed_at"),
            }
        )

    user_query = f"""
You are a credibility-checking assistant for hiring.

You receive structured JSON about a candidate from three sources:

1) CV JSON: Parsed from the candidate's CV (includes projects[], skills[], education, professionalExperiences).
2) LinkedIn JSON: Parsed from the candidate's LinkedIn export (headline, skills, experience).
3) GitHub JSON: Fetched via GitHub REST API (profile, repositories, events, repo_count, language_histogram).

Your job is to verify how plausible the candidate's claimed projects and skills are, given their actual GitHub activity, and to highlight any red or yellow flags.

IMPORTANT RULES:

- Use GitHub "languages" ONLY as evidence for PROGRAMMING LANGUAGES (e.g., Java, JavaScript, Python), not frameworks.
- Infer frameworks/tools (Spring Boot, React, JWT, MySQL, etc.) from:
  - Repo descriptions
  - README text
  - File names and paths (e.g., pom.xml, build.gradle, package.json)
  - Topics/tags if present in the GitHub JSON.

- For EACH CV project:
  - Try to find the most likely matching GitHub repository using:
    - Name similarity (including fuzzy matches, e.g., "HybridShift Tracker" vs "hybrid-shift-portal")
    - Description keyword overlap
    - Tech stack overlap (languages + inferred frameworks)
  - If there is NO plausible repo, treat that project as UNVERIFIED or SUSPICIOUS.

- Do NOT assume a project is real if there is no supporting GitHub evidence, unless:
  - The CV explicitly says the project is private / proprietary, AND
  - The rest of the profile looks consistent and credible.

DATA:

CV PROJECTS (from cv_json.projects):
{json.dumps(cv_projects, ensure_ascii=False)}

FULL CV JSON:
{json.dumps(cv, ensure_ascii=False)}

LINKEDIN JSON:
{json.dumps(li, ensure_ascii=False)}

GITHUB SUMMARY:
- repo_count: {repo_count}
- language_histogram: {json.dumps(language_hist, ensure_ascii=False)}
- profile: {json.dumps(github_profile, ensure_ascii=False)}
- top_repos (name, description, language, pushed_at):
{json.dumps(top_repo_summaries, ensure_ascii=False)}

FULL RAW GITHUB JSON:
{json.dumps(gh, ensure_ascii=False)}

TASKS:

1) For each CV project:
   - State whether there is likely a matching GitHub repo.
   - Briefly explain WHY (or why not), referencing:
     - name similarity
     - description/keyword overlap
     - language and inferred frameworks

2) Global credibility:
   - Assess overall authenticity and consistency between CV, LinkedIn, and GitHub.
   - Highlight RED FLAGS (major concerns) and YELLOW FLAGS (milder uncertainties).
   - Examples:
     - CV lists 4 major projects but GitHub has no repos even remotely matching.
     - CV claims Spring Boot + React expertise but GitHub shows no Java/JS repos and no sign of those frameworks.
     - LinkedIn and CV timelines or roles contradict GitHub activity.

3) Follow-up:
   - Suggest 2–3 concrete follow-up interview questions to probe the most suspicious or uncertain areas.

Return your best analysis in plaintext. This is STAGE 1 of a council; later stages will rank and summarize your answer into strict JSON.
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
        "metadata": metadata,
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
