import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Mail, Github, RefreshCw, Plus, Trash2 } from "lucide-react";
import Shell from "../components/Shell";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { listCandidates, deleteCandidate } from "../services/backendApi";
import { GlassCard, Button } from "../components/UnmaskUI";

export default function CandidatesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listCandidates();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(event, candidateId) {
    event.preventDefault();
    event.stopPropagation();
    setError("");
    setDeletingId(candidateId);
    try {
      await deleteCandidate(candidateId);
      setItems((prev) => prev.filter((c) => c.id !== candidateId));
    } catch (err) {
      setError(err.message || "Failed to delete candidate");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl md:text-4xl font-bold text-cyan-50">
                Candidates
              </h2>
            </div>
            <p className="text-cyan-100/60 text-sm md:text-base">
              AI-powered candidate verification and analysis
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
            <Link to="/candidates/new">
              <Button variant="primary" icon={Plus}>
                Add Candidate
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {loading ? <LoadingState text="Loading candidates..." /> : null}
      {!loading && error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {!loading && !error && (
        <div className="space-y-4">
          {items.length === 0 ? (
            <GlassCard>
              <p className="text-cyan-100/60">
                No candidates yet. Start by adding a new candidate.
              </p>
            </GlassCard>
          ) : (
            items.map((c) => {
              const initials =
                (c.name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("") || "UN";

              const isDeleting = deletingId === c.id;

              return (
                <Link
                  to={`/candidates/${c.id}`}
                  key={c.id}
                  className="block"
                >
                  <GlassCard className="hover:border-cyan-400/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <span className="text-white text-xl font-bold">
                              {initials}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-cyan-50 mb-1">
                            {c.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-cyan-100/70">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              {c.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Github className="w-3.5 h-3.5" />
                              @{c.githubUsername}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={c.status} />
                        <Button
                          variant="secondary"
                          icon={Trash2}
                          loading={isDeleting}
                          disabled={isDeleting}
                          className="text-xs border-red-500/40 text-red-300 hover:bg-red-500/10"
                          onClick={(event) => handleDelete(event, c.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })
          )}
        </div>
      )}
    </Shell>
  );
}
