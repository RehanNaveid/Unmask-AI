import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Github,
  RefreshCw,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import Shell from "../components/Shell";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { listCandidates, deleteCandidate } from "../services/backendApi";
import { Button } from "../components/UnmaskUI";

export default function CandidatesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const hay = `${c.name || ""} ${c.email || ""} ${c.githubUsername || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

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
      <div className="u-page-header">
        <div>
          <div className="u-page-title">Candidates</div>
          <div className="u-page-sub">
            AI-powered candidate verification and analysis
          </div>
        </div>
        <div className="u-header-actions">
          <button className="u-action-btn" onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/candidates/new" className="u-action-btn primary">
            <Plus className="w-4 h-4" /> Add Candidate
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--u-text3)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates…"
            className="u-input-field"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {loading ? <LoadingState text="Loading candidates..." /> : null}
      {!loading && error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {!loading && !error && (
        <div className="u-candidates-list">
          {filtered.length === 0 ? (
            <div className="u-candidate-card" style={{ cursor: "default" }}>
              <div className="u-candidate-info">
                <div className="u-candidate-name">No results</div>
                <div className="u-candidate-meta">
                  <span>Try a different search query.</span>
                </div>
              </div>
            </div>
          ) : (
            filtered.map((c) => {
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
                  <div className="u-candidate-card">
                    <div
                      className="u-candidate-avatar"
                      style={{
                        background: "rgba(0,212,255,0.12)",
                        color: "var(--u-accent)",
                      }}
                    >
                      {initials}
                    </div>

                    <div className="u-candidate-info">
                      <div className="u-candidate-name">{c.name}</div>
                      <div className="u-candidate-meta">
                        <span>
                          <Mail className="w-3.5 h-3.5" /> {c.email}
                        </span>
                        <span>
                          <Github className="w-3.5 h-3.5" /> @{c.githubUsername}
                        </span>
                      </div>
                    </div>

                    <div className="u-candidate-right">
                      <StatusBadge status={c.status} />
                      <button
                        className="u-action-btn danger"
                        onClick={(event) => handleDelete(event, c.id)}
                        disabled={isDeleting}
                        aria-label="Delete candidate"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </Shell>
  );
}
