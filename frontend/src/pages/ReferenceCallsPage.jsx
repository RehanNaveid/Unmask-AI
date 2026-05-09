import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Phone,
  MessageSquare,
  AlertCircle,
  Wand2,
  PhoneCall,
  History,
} from "lucide-react";
import Shell from "../components/Shell";
import {
  fetchTranscript,
  generateSummary,
  startReferenceCall,
} from "../services/referenceApi";
import { Button } from "../components/UnmaskUI";

const STORE_KEY = "unmask_reference_calls";

function readStore() {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStore(data) {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export default function ReferenceCallsPage() {
  const { candidateId } = useParams();
  const location = useLocation();
  const candidateName = location.state?.candidateName || "Candidate";

  const [referenceName, setReferenceName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const candidateHistory = useMemo(
    () => history.filter((h) => h.candidateId === candidateId),
    [history, candidateId]
  );

  useEffect(() => {
    setHistory(readStore());
  }, []);

  function updateStore(next) {
    setHistory(next);
    writeStore(next);
  }

  async function handleStartCall() {
    setLoading(true);
    setError("");
    try {
      const data = await startReferenceCall({
        candidate_id: candidateId,
        candidate_name: candidateName,
        reference_name: referenceName,
        phone_number: phoneNumber,
      });

      const newItem = {
        candidateId,
        candidateName,
        referenceName,
        phoneNumber,
        referenceCallId: data.reference_call_id,
        conversationId: data.conversation_id,
        status: "calling",
        summary: "",
      };
      setActive(newItem);
      updateStore([newItem, ...history]);
    } catch (err) {
      setError(err.message || "Could not start call");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchTranscript(item) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTranscript(item.referenceCallId);
      const nextStatus =
        data.status === "completed" ? "completed" : item.status;
      const next = history.map((h) =>
        h.referenceCallId === item.referenceCallId
          ? { ...h, status: nextStatus }
          : h
      );
      updateStore(next);
      setActive(
        next.find((x) => x.referenceCallId === item.referenceCallId) || null
      );
    } catch (err) {
      setError(err.message || "Transcript fetch failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSummary(item) {
    setLoading(true);
    setError("");
    try {
      const data = await generateSummary(item.referenceCallId);
      const next = history.map((h) =>
        h.referenceCallId === item.referenceCallId
          ? { ...h, status: "summarized", summary: data.summary || "" }
          : h
      );
      updateStore(next);
      setActive(
        next.find((x) => x.referenceCallId === item.referenceCallId) || null
      );
    } catch (err) {
      setError(err.message || "Summary generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="u-page-header">
        <div>
          <div className="u-page-title">Reference Calls</div>
          <div className="u-page-sub">
            {candidateName} — AI-powered reference verification
          </div>
        </div>
        <button className="u-action-btn primary" type="button" disabled>
          <Wand2 className="w-4 h-4" /> Manage live calls
        </button>
      </div>

      <div className="u-ref-layout">
        <div className="u-panel-card">
          <div className="u-panel-title">
            <Phone className="w-4 h-4" style={{ color: "var(--u-accent)" }} />{" "}
            Start New Reference Call
          </div>

          <div className="u-input-group">
            <div className="u-input-label">Reference Name</div>
            <input
              className="u-input-field"
              placeholder="Hiring manager or teammate"
              value={referenceName}
              onChange={(e) => setReferenceName(e.target.value)}
            />
          </div>

          <div className="u-input-group">
            <div className="u-input-label">Reference Phone Number</div>
            <input
              className="u-input-field"
              placeholder="+1..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {error ? (
            <div className="u-auth-error" style={{ marginBottom: 12 }}>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <AlertCircle className="w-4 h-4" />
                {error}
              </span>
            </div>
          ) : null}

          <button
            className="u-start-call-btn"
            type="button"
            onClick={handleStartCall}
            disabled={loading || !referenceName || !phoneNumber}
          >
            <PhoneCall className="w-4 h-4" />
            {loading ? "Submitting..." : "Start Reference Call"}
          </button>
        </div>

        <div className="u-panel-card">
          <div className="u-panel-title">
            <History className="w-4 h-4" style={{ color: "var(--u-accent)" }} />{" "}
            Call History
          </div>

          {candidateHistory.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--u-text3)" }}>
              No reference calls yet for this candidate.
            </div>
          ) : (
            <div>
              {candidateHistory.map((item) => {
                const statusClass =
                  item.status === "summarized"
                    ? "summarized"
                    : item.status === "completed"
                    ? "completed"
                    : "calling";

                return (
                  <div className="u-call-history-item" key={item.referenceCallId}>
                    <div className="u-chi-top">
                      <div className="u-chi-name">{item.referenceName}</div>
                      <div className={`u-chi-status ${statusClass}`}>
                        {item.status}
                      </div>
                    </div>
                    <div className="u-chi-phone">{item.phoneNumber}</div>
                    <div className="u-chi-actions">
                      <button
                        className="u-chi-btn"
                        type="button"
                        onClick={() => handleFetchTranscript(item)}
                        disabled={loading}
                      >
                        Fetch Transcript
                      </button>
                      <button
                        className="u-chi-btn primary"
                        type="button"
                        onClick={() => handleGenerateSummary(item)}
                        disabled={loading}
                      >
                        Generate Summary
                      </button>
                    </div>
                    {item.summary ? (
                      <div className="u-summary-box negative">{item.summary}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {active ? (
        <div className="u-active-call-bar">
          <div className="u-live-dot" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>
              Active Call · {active.referenceName}
            </div>
            <div style={{ fontSize: 12, color: "var(--u-text3)" }}>
              Status: {active.status} · call id: {active.referenceCallId}
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setActive(null)}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </div>
      ) : null}
    </Shell>
  );
}
