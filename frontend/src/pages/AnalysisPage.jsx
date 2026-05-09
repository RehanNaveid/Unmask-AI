import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  RefreshCw,
  Sparkles,
  Flag,
  AlertTriangle,
  MessageSquare,
  Mail,
  Github,
} from "lucide-react";
import Shell from "../components/Shell";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { analyzeCandidate } from "../services/llmApi";
import {
  getCandidate,
  getCandidateAnalysis,
  getParsedCv,
  getParsedGithub,
  getParsedLinkedin,
} from "../services/backendApi";
import { Button } from "../components/UnmaskUI";

export default function AnalysisPage() {
  const { candidateId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [candidateMeta, setCandidateMeta] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [analysisData, candidateData] = await Promise.all([
        getCandidateAnalysis(candidateId),
        getCandidate(candidateId).catch(() => null),
      ]);
      setAnalysis(analysisData);
      setCandidateMeta(candidateData);
    } catch (err) {
      setError(err.message || "Analysis not ready yet");
    } finally {
      setLoading(false);
    }
  }

  async function runLiveCouncil() {
    setLiveLoading(true);
    setError("");
    try {
      const [cv, linkedin, github] = await Promise.all([
        getParsedCv(candidateId),
        getParsedLinkedin(candidateId).catch(() => ({ linkedin: {} })),
        getParsedGithub(candidateId),
      ]);

      const result = await analyzeCandidate({
        cv_json: cv.cv || {},
        linkedin_json: linkedin.linkedin || {},
        github_json: github.github || {},
      });
      setLive(result);
    } catch (err) {
      setError(err.message || "Live council run failed");
    } finally {
      setLiveLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [candidateId]);

  const liveStage = useMemo(() => (live?.stage3 ? live.stage3 : live), [live]);

  const normalizedLive = useMemo(() => {
    if (!liveStage || typeof liveStage !== "object") return null;
    return {
      score: liveStage.score ?? liveStage.trustScore ?? liveStage.credibilityScore,
      label: liveStage.label ?? liveStage.verdict ?? liveStage.statusLabel ?? null,
      recommendation:
        liveStage.recommendation ??
        liveStage.summary ??
        liveStage.finalRecommendation ??
        null,
      explanation: liveStage.explanation ?? liveStage.reasoning ?? null,
      redFlags: liveStage.redFlags ?? liveStage.red_flags,
      yellowFlags: liveStage.yellowFlags ?? liveStage.yellow_flags,
      suggestedQuestions:
        liveStage.suggestedQuestions ??
        liveStage.questions ??
        liveStage.interviewQuestions ??
        liveStage.interview_questions,
      projectVerification:
        liveStage.projectVerification ?? liveStage.project_verification,
      candidateName:
        liveStage.candidateName ?? liveStage.name ?? liveStage.candidate_name ?? null,
      candidateEmail:
        liveStage.candidateEmail ?? liveStage.email ?? liveStage.candidate_email ?? null,
      candidateGithubUsername:
        liveStage.candidateGithubUsername ??
        liveStage.githubUsername ??
        liveStage.github_username ??
        null,
    };
  }, [liveStage]);

  const activeAnalysis = useMemo(() => {
    if (!analysis) return normalizedLive;
    if (!normalizedLive) return analysis;
    return {
      ...analysis,
      ...normalizedLive,
      redFlags:
        normalizedLive.redFlags && normalizedLive.redFlags.length >= 0
          ? normalizedLive.redFlags
          : analysis.redFlags,
      yellowFlags:
        normalizedLive.yellowFlags && normalizedLive.yellowFlags.length >= 0
          ? normalizedLive.yellowFlags
          : analysis.yellowFlags,
      suggestedQuestions:
        normalizedLive.suggestedQuestions &&
        normalizedLive.suggestedQuestions.length >= 0
          ? normalizedLive.suggestedQuestions
          : analysis.suggestedQuestions,
      projectVerification:
        normalizedLive.projectVerification &&
        normalizedLive.projectVerification.length >= 0
          ? normalizedLive.projectVerification
          : analysis.projectVerification,
    };
  }, [analysis, normalizedLive]);

  const numericScore = useMemo(() => {
    if (!activeAnalysis) return null;
    if (typeof activeAnalysis.score === "number") return activeAnalysis.score;
    const n = Number(activeAnalysis.score);
    return Number.isNaN(n) ? null : n;
  }, [activeAnalysis]);

  const initials = useMemo(() => {
    const name =
      activeAnalysis?.candidateName || candidateMeta?.name || "Candidate";
    return name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [activeAnalysis, candidateMeta]);

  const displayName = activeAnalysis?.candidateName || candidateMeta?.name || "Candidate";
  const displayEmail = activeAnalysis?.candidateEmail || candidateMeta?.email || "—";
  const displayGithub =
    activeAnalysis?.candidateGithubUsername || candidateMeta?.githubUsername || "";

  const scoreColor =
    typeof numericScore === "number" && numericScore < 60
      ? "var(--u-danger)"
      : typeof numericScore === "number" && numericScore < 80
      ? "var(--u-warn)"
      : "var(--u-accent3)";

  return (
    <Shell>
      <Link className="u-backlink" to={`/candidates/${candidateId}`}>
        ← Back to Candidate
      </Link>

      {loading ? <LoadingState text="Loading analysis..." /> : null}
      {!loading && error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {!loading && !error && activeAnalysis ? (
        <>
          <div className="u-analysis-header">
            <div
              className="u-candidate-avatar-lg"
              style={{
                background: "rgba(0,212,255,0.12)",
                color: "var(--u-accent)",
              }}
            >
              {initials}
            </div>

            <div>
              <div className="u-analysis-name">
                {displayName}
              </div>
              <div className="u-analysis-meta">
                <span>
                  <Mail className="w-4 h-4" /> {displayEmail}
                </span>
                <span>
                  <Github className="w-4 h-4" />{" "}
                  {displayGithub ? `@${displayGithub}` : "—"}
                </span>
              </div>
            </div>

            <div className="u-score-display">
              <div className="u-big-score" style={{ color: scoreColor }}>
                {numericScore ?? "—"}
              </div>
              <div className="u-score-lbl">Trust Score</div>
              {normalizedLive ? (
                <div style={{ fontSize: 11, color: "var(--u-accent)", marginTop: 2 }}>
                  from latest live run
                </div>
              ) : null}
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button className="u-action-btn" onClick={load} disabled={loading}>
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
                <button
                  className="u-action-btn primary"
                  onClick={runLiveCouncil}
                  disabled={liveLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {liveLoading ? "Running..." : "Run Live Council"}
                </button>
              </div>
            </div>
          </div>

          <div className="u-tab-bar">
            <div
              className={`u-tab ${tab === "overview" ? "active" : ""}`}
              onClick={() => setTab("overview")}
              role="button"
              tabIndex={0}
            >
              Overview
            </div>
            <div
              className={`u-tab ${tab === "projects" ? "active" : ""}`}
              onClick={() => setTab("projects")}
              role="button"
              tabIndex={0}
            >
              Project Verification
            </div>
            <div
              className={`u-tab ${tab === "questions" ? "active" : ""}`}
              onClick={() => setTab("questions")}
              role="button"
              tabIndex={0}
            >
              Interview Questions
            </div>
            <div
              className={`u-tab ${tab === "live" ? "active" : ""}`}
              onClick={() => setTab("live")}
              role="button"
              tabIndex={0}
            >
              Live Council
            </div>
          </div>

          {tab === "overview" ? (
            <div className="u-analysis-grid">
              <div className="u-analysis-card">
                <div className="u-analysis-card-title">
                  <Flag className="w-4 h-4" /> Red Flags Detected
                </div>
                <div className="u-flag-list">
                  {(activeAnalysis.redFlags || []).length === 0 ? (
                    <div className="u-flag-entry green">
                      <div className="u-flag-entry-text">
                        <strong>No red flags</strong>
                        None identified in the persisted verdict.
                      </div>
                    </div>
                  ) : (
                    (activeAnalysis.redFlags || []).map((f, i) => (
                      <div className="u-flag-entry red" key={`rf-${i}`}>
                        <div className="u-flag-entry-text">
                          <strong>Red flag</strong>
                          {f}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="u-analysis-card">
                <div className="u-analysis-card-title">
                  <AlertTriangle className="w-4 h-4" /> Yellow Flags Detected
                </div>
                <div className="u-flag-list">
                  {(activeAnalysis.yellowFlags || []).length === 0 ? (
                    <div className="u-flag-entry green">
                      <div className="u-flag-entry-text">
                        <strong>No yellow flags</strong>
                        None identified in the persisted verdict.
                      </div>
                    </div>
                  ) : (
                    (activeAnalysis.yellowFlags || []).map((f, i) => (
                      <div className="u-flag-entry amber" key={`yf-${i}`}>
                        <div className="u-flag-entry-text">
                          <strong>Yellow flag</strong>
                          {f}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="u-analysis-card" style={{ gridColumn: "1/-1" }}>
                <div className="u-analysis-card-title">
                  <MessageSquare className="w-4 h-4" /> Persisted Verdict
                </div>
                <div style={{ fontSize: 12, color: "var(--u-text2)", lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 800, color: "var(--u-text)", marginBottom: 6 }}>
                    {activeAnalysis.label || "Verdict"}
                  </div>
                  <div style={{ marginBottom: 10 }}>{activeAnalysis.recommendation}</div>
                  {activeAnalysis.explanation ? (
                    <div style={{ color: "var(--u-text3)" }}>{activeAnalysis.explanation}</div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "projects" ? (
            <div className="u-analysis-card">
              <div className="u-analysis-card-title">
                Project Verification
              </div>
              {(activeAnalysis.projectVerification || []).length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--u-text3)" }}>
                  No project verification data.
                </div>
              ) : (
                <div className="u-flag-list">
                  {activeAnalysis.projectVerification.map((p, idx) => (
                    <div
                      key={`${p.project_name}-${idx}`}
                      className="u-flag-entry green"
                      style={{ borderLeftColor: "var(--u-accent)" }}
                    >
                      <div className="u-flag-entry-text">
                        <strong>
                          {p.project_name} · {p.status}
                          {p.confidence != null ? ` (${p.confidence})` : ""}
                        </strong>
                        {p.explanation || p.description || ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "questions" ? (
            <div className="u-analysis-card">
              <div className="u-analysis-card-title">
                <MessageSquare className="w-4 h-4" /> Suggested Interview Questions
              </div>
              {(activeAnalysis.suggestedQuestions || []).length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--u-text3)" }}>
                  No suggested questions available yet.
                </div>
              ) : (
                <div className="u-interview-qs">
                  {(activeAnalysis.suggestedQuestions || []).map((q, i) => (
                    <div className="u-iq-item" key={`q-${i}`}>
                      <div className="u-iq-num">Q{i + 1}</div>
                      <div>{q}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "live" ? (
            <div className="u-analysis-card">
              <div className="u-analysis-card-title">Live Council Result</div>
              {live ? (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    overflowX: "auto",
                    fontSize: 12,
                    color: "var(--u-text2)",
                  }}
                >
                  {JSON.stringify(live.stage3 || live, null, 2)}
                </pre>
              ) : (
                <div style={{ fontSize: 12, color: "var(--u-text3)" }}>
                  Run Live Council to generate a fresh result.
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </Shell>
  );
}
