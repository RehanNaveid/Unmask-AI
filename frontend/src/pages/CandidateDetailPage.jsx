import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mail, Github, ArrowLeft, ShieldCheck, Phone } from "lucide-react";
import Shell from "../components/Shell";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import StatusBadge from "../components/StatusBadge";
import { getCandidate } from "../services/backendApi";
import { Button } from "../components/UnmaskUI";

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
        <div>
          <Link className="u-backlink" to="/candidates">
            <ArrowLeft className="w-4 h-4" /> Back to Candidates
          </Link>

          <div className="u-detail-header">
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
              <div className="u-analysis-name">{candidate.name}</div>
              <div className="u-analysis-meta">
                <span>
                  <Mail className="w-4 h-4" /> {candidate.email}
                </span>
                <span>
                  <Github className="w-4 h-4" /> @{candidate.githubUsername}
                </span>
              </div>
              <div style={{ marginTop: 10 }}>
                <StatusBadge status={candidate.status} />
              </div>
            </div>

            <div className="u-detail-actions">
              <Link to={`/candidates/${candidate.id}/analysis`} className="u-action-btn primary">
                <ShieldCheck className="w-4 h-4" /> View AI Analysis
              </Link>
              <Link
                to={`/candidates/${candidate.id}/reference-calls`}
                state={{ candidateName: candidate.name }}
                className="u-action-btn"
              >
                <Phone className="w-4 h-4" /> Reference Calls
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
