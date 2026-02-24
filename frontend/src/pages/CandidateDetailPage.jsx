import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mail, Github, UserCircle2 } from "lucide-react";
import Shell from "../components/Shell";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import StatusBadge from "../components/StatusBadge";
import { getCandidate } from "../services/backendApi";
import { GlassCard, Button } from "../components/UnmaskUI";

export default function CandidateDetailPage() {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getCandidate(candidateId);
      setCandidate(data);
    } catch (err) {
      setError(err.message || "Failed to load candidate");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [candidateId]);

  const initials =
    (candidate?.name || "")
      .split(" ")
      .map((n) => n[0])
      .join("") || "UN";

  return (
    <Shell>
      {loading ? <LoadingState text="Loading candidate..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && candidate ? (
        <div className="space-y-8">
          <GlassCard glow>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                    <span className="text-white text-3xl font-bold">
                      {initials}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-slate-900/90 border border-cyan-400/40 flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5 text-cyan-300" />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-cyan-50 mb-2">
                    {candidate.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-cyan-100/70 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {candidate.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Github className="w-4 h-4" />
                      @{candidate.githubUsername}
                    </span>
                  </div>
                  <StatusBadge status={candidate.status} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={`/candidates/${candidate.id}/analysis`}>
                  <Button className="w-full sm:w-auto">
                    View AI Analysis
                  </Button>
                </Link>
                <Link
                  to={`/candidates/${candidate.id}/reference-calls`}
                  state={{ candidateName: candidate.name }}
                >
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Reference Calls
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </Shell>
  );
}
