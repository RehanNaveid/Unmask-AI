import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Award,
  Target,
  Flag,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Shell from "../components/Shell";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { analyzeCandidate } from "../services/llmApi";
import {
  getCandidateAnalysis,
  getParsedCv,
  getParsedGithub,
  getParsedLinkedin,
} from "../services/backendApi";
import {
  GlassCard,
  Button,
  Badge,
  ScoreRing,
} from "../components/UnmaskUI";

export default function AnalysisPage() {
  const { candidateId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getCandidateAnalysis(candidateId);
      setAnalysis(data);
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

  const numericScore =
    analysis && typeof analysis.score === "number"
      ? analysis.score
      : analysis && !Number.isNaN(Number(analysis.score))
      ? Number(analysis.score)
      : null;

  return (
    <Shell>
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-cyan-50">
              Candidate Analysis
            </h2>
            <p className="text-cyan-100/60 text-sm md:text-base">
              Persisted verdicts and on-demand live council runs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={load}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              onClick={runLiveCouncil}
              disabled={liveLoading}
              loading={liveLoading}
              icon={Sparkles}
            >
              {liveLoading ? "Running Live Council..." : "Run Live Council"}
            </Button>
          </div>
        </div>
      </section>

      {loading ? <LoadingState text="Loading analysis..." /> : null}
      {!loading && error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {!loading && !error && analysis ? (
        <div className="space-y-8">
          <GlassCard glow>
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <ScoreRing score={numericScore ?? undefined} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-7 h-7 text-emerald-400" />
                  <h3 className="text-2xl font-bold text-cyan-50">
                    {analysis.label || "Analysis Result"}
                  </h3>
                </div>
                <p className="text-cyan-100/70 text-sm md:text-base mb-4">
                  {analysis.recommendation}
                </p>
                {analysis.explanation ? (
                  <p className="text-cyan-100/60 text-xs md:text-sm">
                    {analysis.explanation}
                  </p>
                ) : null}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-cyan-50">
                Project Verification
              </h3>
            </div>
            {(analysis.projectVerification || []).length === 0 ? (
              <p className="text-cyan-100/60">
                No project verification data.
              </p>
            ) : (
              <div className="space-y-4">
                {analysis.projectVerification.map((p, idx) => (
                  <div
                    key={`${p.project_name}-${idx}`}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-cyan-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-cyan-50">
                        {p.project_name}
                      </p>
                      <p className="text-xs text-cyan-100/70">
                        {p.explanation || p.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          p.status === "verified"
                            ? "success"
                            : p.status === "partial"
                            ? "warning"
                            : "default"
                        }
                      >
                        {p.status}
                      </Badge>
                      {p.confidence != null ? (
                        <span className="text-xs text-cyan-100/70">
                          {p.confidence}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard>
              <div className="flex items-center gap-3 mb-4">
                <Flag className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-bold text-cyan-50">Red Flags</h3>
              </div>
              {(analysis.redFlags || []).length === 0 ? (
                <p className="text-cyan-100/60 text-sm">
                  No red flags identified.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(analysis.redFlags || []).map((f, i) => (
                    <li
                      key={`r-${i}`}
                      className="text-sm text-cyan-50/90 flex gap-2"
                    >
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-cyan-50">
                  Yellow Flags
                </h3>
              </div>
              {(analysis.yellowFlags || []).length === 0 ? (
                <p className="text-cyan-100/60 text-sm">
                  No yellow flags identified.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(analysis.yellowFlags || []).map((f, i) => (
                    <li
                      key={`y-${i}`}
                      className="text-sm text-cyan-50/90 flex gap-2"
                    >
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-cyan-50">
                Suggested Questions
              </h3>
            </div>
            {(analysis.suggestedQuestions || []).length === 0 ? (
              <p className="text-cyan-100/60 text-sm">
                No suggested questions available yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {(analysis.suggestedQuestions || []).map((q, i) => (
                  <li
                    key={`q-${i}`}
                    className="text-sm text-cyan-50/90 flex gap-2"
                  >
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          {live ? (
            <GlassCard>
              <h3 className="text-lg font-bold text-cyan-50 mb-3">
                Live Council Result
              </h3>
              <pre className="text-xs text-cyan-50/80 bg-slate-950/40 rounded-2xl p-4 overflow-auto">
                {JSON.stringify(live.stage3 || live, null, 2)}
              </pre>
            </GlassCard>
          ) : null}
        </div>
      ) : null}
    </Shell>
  );
}
