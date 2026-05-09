"""
LLM Council Pipeline for Candidate Credibility Analysis
- Stage 1: Free models → plaintext assessments (no JSON required)
- Stage 2: Free models rank the plaintext responses
- Stage 3: Chairman (Gemini / Llama 70B) produces strict JSON summary
"""

import asyncio
from typing import List, Dict, Any, Tuple
import re
import json
from .openrouter import query_models_parallel, query_model
from .utils import normalize_json   
from .config import COUNCIL_MODELS, CHAIRMAN_MODEL, MAX_RETRIES


#####################################################################
# STAGE 1 — Free models generate plaintext assessments
#####################################################################


async def stage1_collect_responses(prompt: str) -> List[Dict[str, Any]]:
    print("[STAGE 1] Collecting individual plaintext assessments...")
    print(f"[STAGE 1] Prompt length: {len(prompt)} chars")
    print(f"[STAGE 1] Models: {COUNCIL_MODELS}")

    messages = [{"role": "user", "content": prompt}]
    responses = await query_models_parallel(COUNCIL_MODELS, messages)
    print(f"[STAGE 1] Raw responses received: {len(responses)}")

    stage1_results: List[Dict[str, Any]] = []

    for model, response in responses.items():
        if not response:
            print(f"[STAGE 1] Model {model}: NO RESPONSE (None)")
            continue

        raw = (response.get("content") or "").strip()
        print(f"[STAGE 1] Model {model}: Response length = {len(raw)}")

        if not raw:
            print(f"[STAGE 1] Model {model}: Empty content after strip, skipping")
            continue

        stage1_results.append(
            {
                "model": model,
                "raw": raw,
            }
        )

    print(f"[STAGE 1] Valid plaintext assessments: {len(stage1_results)}")
    return stage1_results


#####################################################################
# STAGE 2 — Peer Ranking of plaintext responses
#####################################################################


EVALUATION_CRITERIA = [
    "Identifies concrete evidence (skills, repos, timeline)",
    "Explains credibility flags clearly",
    "Avoids vagueness or hallucination",
    "Considers full profile (CV + LinkedIn + GitHub)",
    "Is logically consistent and precise",
]


def generate_stage2_prompt(stage1_results: List[Dict[str, Any]]) -> str:
    print(f"[STAGE 2] Generating ranking prompt for {len(stage1_results)} responses...")
    labels = [chr(65 + i) for i in range(len(stage1_results))]  # A, B, C, ...

    responses_text = "\n\n".join(
        [
            f"Response {label}:\n{r['raw']}"
            for label, r in zip(labels, stage1_results)
        ]
    )

    rubric = "\n".join([f"- {c}" for c in EVALUATION_CRITERIA])

    prompt = f"""
You are a senior reviewer evaluating multiple AI-generated assessments of a single candidate's credibility.

You will see several anonymized assessments of the same candidate, each labeled "Response A", "Response B", etc.
Use the rubric below to judge which assessment is most helpful and reliable.

Rubric (what makes a good assessment):
{rubric}

Instructions:
1. Carefully read all responses.
2. Compare how well each response uses the evidence, explains its reasoning, and avoids hallucinations.
3. Decide which response is best overall, then the second-best, and so on.

STRICT OUTPUT FORMAT (very important):
You MUST include a final section at the end of your answer with this exact structure:

FINAL RANKING:
1. Response X
2. Response Y
3. Response Z

Where X, Y, Z are the actual labels (A, B, C, etc.).
Do not add any extra text on the same lines as the ranking.
You may write free-form analysis before the "FINAL RANKING" block.

Responses:
{responses_text}
"""
    print(f"[STAGE 2] Ranking prompt length: {len(prompt)} chars")
    return prompt


def parse_ranking_from_text(text: str) -> List[str]:
    """Parse the 'FINAL RANKING' section from the model's response."""
    print("[STAGE 2] Parsing ranking from model response...")
    # Look for the "FINAL RANKING:" section first
    if "FINAL RANKING:" in text:
        _, after = text.split("FINAL RANKING:", 1)
    else:
        after = text

    # Preferred: lines like "1. Response A"
    numbered_matches = re.findall(r"\d+\.\s*Response [A-Z]", after)
    if numbered_matches:
        labels = [
            re.search(r"Response [A-Z]", m).group()
            for m in numbered_matches
            if re.search(r"Response [A-Z]", m)
        ]
        print(f"[STAGE 2] Parsed numbered labels: {labels}")
        return labels

    # Fallback: any "Response X" in order
    matches = re.findall(r"Response [A-Z]", after)
    print(f"[STAGE 2] Parsed fallback labels: {matches}")
    return matches or []


async def stage2_collect_rankings(
    prompt: str, stage1_results: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    print("[STAGE 2] Collecting peer rankings...")
    labels = [chr(65 + i) for i in range(len(stage1_results))]
    label_to_model = {
        f"Response {l}": r["model"] for l, r in zip(labels, stage1_results)
    }
    print(f"[STAGE 2] Label-to-model map: {label_to_model}")

    stage2_prompt = generate_stage2_prompt(stage1_results)

    responses = await query_models_parallel(
        COUNCIL_MODELS, [{"role": "user", "content": stage2_prompt}]
    )
    print(f"[STAGE 2] Raw ranking responses: {len(responses)}")

    stage2_results: List[Dict[str, Any]] = []

    for model, response in responses.items():
        if not response:
            print(f"[STAGE 2] Model {model}: NO RANKING RESPONSE")
            continue

        # text = response.get("content", "")
        text = response.get("content") or ""
        print(f"[STAGE 2] Model {model}: Ranking response length = {len(text)}")
        parsed = parse_ranking_from_text(text)

        if parsed:
            print(f"[STAGE 2] Model {model}: Parsed ranking = {parsed}")
            stage2_results.append(
                {"model": model, "ranking": text, "parsed_ranking": parsed}
            )
        else:
            print(f"[STAGE 2] Model {model}: FAILED to parse ranking")

    print(f"[STAGE 2] Valid rankings: {len(stage2_results)}")
    return stage2_results, label_to_model


#####################################################################
# STAGE 3 — Final JSON Chairman Verdict
#####################################################################


async def stage3_synthesize_final(
    prompt: str,
    stage1_results: List[Dict[str, Any]],
    stage2_results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    print("[STAGE 3] Synthesizing final JSON verdict (chairman)...")

    s1_summary = "\n\n".join(
        [
            f"Model: {r['model']}\nResponse:\n{r['raw']}"
            for r in stage1_results
        ]
    )

    s2_summary = "\n\n".join(
        [
            f"Model: {r['model']}\nRanking:\n{r['ranking']}"
            for r in stage2_results
        ]
    )

    chairman_prompt = f"""
You are the Chairman of an AI council assessing the credibility of a job candidate.

You are given:
- Stage 1: multiple plaintext assessments of the candidate from different models.
- Stage 2: how these models ranked each other's assessments.

Your goals:
1. Infer a final credibility label and score for this candidate.
2. For EACH CV project, decide whether GitHub evidence supports it and how strongly.
3. Evaluate how well the candidate's claimed tech stack (languages + frameworks) is supported by GitHub.
4. Consolidate the most important reasons supporting your verdict.
5. Clearly separate RED FLAGS (serious issues) from YELLOW FLAGS (milder concerns).
6. Recommend what the hiring pipeline should do next.
7. Suggest 2–3 targeted follow-up interview questions.

VERY IMPORTANT INSTRUCTIONS:
- You MUST respond with STRICT, VALID JSON only.
- Do NOT include any text before or after the JSON.
- The JSON must match this exact schema:

{{
  "label": "credible" | "suspicious" | "uncertain",
  "score": float,  // 20 to 100

  "project_verification": [
    {{
      "project_name": "name of the project from the CV",
      "status": "verified" | "unverified" | "ambiguous" | "unverifiable",
      "matched_repo": "name of the most likely GitHub repo or null",
      "confidence": float,  // 20 to 100
      "evidence": [
        "short evidence sentence 1 referencing CV + GitHub",
        "short evidence sentence 2"
      ]
    }}
  ],

  "language_alignment": {{
    "cv_languages_supported": [
      "language or framework that is clearly supported by GitHub evidence"
    ],
    "cv_languages_missing_on_github": [
      "language or framework claimed in CV/LinkedIn but not supported by GitHub"
    ],
    "notes": [
      "short sentence explaining overall alignment or mismatch between claimed stack and GitHub repos"
    ]
  }},

  "red_flags": [
    "Detailed description of a critical credibility issue with brief evidence",
    "Another specific red flag"
  ],

  "yellow_flags": [
    "Detailed description of a milder concern or uncertainty with brief evidence",
    "Another specific yellow flag"
  ],

  "consolidated_reasons": [
    "1–3 high-level reasons that summarize your overall judgment"
  ],

  "recommendation": "proceed" | "human_review" | "reject",

  "explanation": "Short paragraph (2–4 sentences) summarizing the candidate's credibility, key supporting evidence, and overall risk level.",

  "suggested_questions": [
    "Concrete follow-up question 1 focused on the riskiest project or skill claim",
    "Concrete follow-up question 2",
    "Concrete follow-up question 3"
  ]
}}

Guidance:
- Use Stage 1 responses as raw evidence for project–repo matching and tech stack verification.
- Use Stage 2 rankings to trust the most careful, evidence-based analyses more than weaker ones.
- RED FLAGS are serious issues that directly undermine trust (e.g., unverifiable flagship projects, strong tech stack mismatch, clear timeline inconsistencies).
- YELLOW FLAGS are weaker or uncertain issues (e.g., incomplete repos, weak documentation, fork-heavy portfolio without clear original work).

Content to analyze:

STAGE 1 RESPONSES:
{s1_summary}

STAGE 2 RANKINGS:
{s2_summary}
"""
    print(f"[STAGE 3] Chairman prompt length: {len(chairman_prompt)} chars")

    # ── Retry loop (replaces the old single try/except) ──────────────────
    last_error = None
    for attempt in range(MAX_RETRIES):
        if attempt > 0:
            wait = 2 ** (attempt - 1)   # attempt 1 → 1s, attempt 2 → 2s
            print(f"[STAGE 3] Retry {attempt}/{MAX_RETRIES - 1}, waiting {wait}s...")
            await asyncio.sleep(wait)

        response = await query_model(
            CHAIRMAN_MODEL, [{"role": "user", "content": chairman_prompt}]
        )

        raw = ""
        if response:
            raw = (response.get("content") or "").strip()

        if not raw:
            last_error = "empty response from chairman"
            print(f"[STAGE 3] Attempt {attempt + 1}: {last_error}")
            continue

        parsed = normalize_json(raw)

        if parsed and isinstance(parsed, dict) and "label" in parsed:
            print(f"[STAGE 3] Success on attempt {attempt + 1}")
            return parsed

        last_error = f"malformed JSON — first 300 chars: {raw[:300]}"
        print(f"[STAGE 3] Attempt {attempt + 1} failed — {last_error}")

    print(f"[STAGE 3] All {MAX_RETRIES} attempts exhausted")
    return {"error": "Chairman failed after retries", "detail": last_error}
#####################################################################
# MAIN ORCHESTRATOR
#####################################################################


async def run_full_council(prompt: str):
    print("[COUNCIL] Starting full 3-stage council pipeline...")
    print(f"[COUNCIL] Input prompt length: {len(prompt)}")

    # Stage 1
    stage1 = await stage1_collect_responses(prompt)
    if not stage1:
        print("[COUNCIL] ERROR: No Stage 1 responses")
        return [], [], {"error": "No Stage 1 responses"}, {}

    # Stage 2
    stage2, label_map = await stage2_collect_rankings(prompt, stage1)

    # Stage 3
    stage3 = await stage3_synthesize_final(prompt, stage1, stage2)

    # UI Summary
    summary: Dict[str, Any] = {}
    if (
        isinstance(stage3, dict)
        and all(k in stage3 for k in ["label", "score", "recommendation"])
    ):
        summary = {
            "label": stage3["label"],
            "score": stage3["score"],
            "recommendation": stage3["recommendation"],
            "explanation": stage3.get("explanation", ""),
            "suggested_questions": stage3.get("suggested_questions", []),
        }

    print("[COUNCIL] Finished pipeline")
    print(f"[COUNCIL] Summary: {summary}")

    return stage1, stage2, stage3, {
        "label_to_model": label_map,
        "summary": summary,
    }