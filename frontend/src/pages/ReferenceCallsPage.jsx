import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Phone,
  RefreshCw,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import Shell from "../components/Shell";
import {
  fetchTranscript,
  generateSummary,
  startReferenceCall,
} from "../services/referenceApi";
import { GlassCard, Button, Badge } from "../components/UnmaskUI";

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
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-cyan-50">
              Reference Calls
            </h2>
            <p className="text-cyan-100/60 text-sm md:text-base">
              {candidateName} &mdash; AI-powered reference verification.
            </p>
          </div>
          <Badge variant="info" icon={Phone}>
            Manage and summarize live reference calls
          </Badge>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <GlassCard glow>
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-semibold text-cyan-50">
                Start New Reference Call
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyan-100/90 mb-2">
                  Reference Name
                </label>
                <input
                  value={referenceName}
                  onChange={(e) => setReferenceName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/30 rounded-2xl text-sm text-cyan-50 placeholder:text-cyan-100/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50"
                  placeholder="Hiring manager or teammate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-100/90 mb-2">
                  Reference Phone Number
                </label>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1..."
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/30 rounded-2xl text-sm text-cyan-50 placeholder:text-cyan-100/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50"
                />
              </div>
              {error ? (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </p>
              ) : null}
              <Button
                onClick={handleStartCall}
                disabled={loading || !referenceName || !phoneNumber}
                loading={loading}
                className="w-full"
                icon={RefreshCw}
              >
                {loading ? "Submitting..." : "Start Call"}
              </Button>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-semibold text-cyan-50">
                Call History
              </h3>
            </div>
            {candidateHistory.length === 0 ? (
              <p className="text-cyan-100/60 text-sm">
                No reference calls yet for this candidate.
              </p>
            ) : (
              <div className="space-y-4">
                {candidateHistory.map((item) => (
                  <GlassCard key={item.referenceCallId} className="bg-slate-900/60">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-cyan-50">
                            {item.referenceName}
                          </p>
                          <p className="text-xs text-cyan-100/60">
                            {item.phoneNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-cyan-100/60">
                          <span>status: {item.status}</span>
                          <span className="hidden sm:inline">
                            call id: {item.referenceCallId}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => handleFetchTranscript(item)}
                          disabled={loading}
                        >
                          Fetch Transcript
                        </Button>
                        <Button
                          onClick={() => handleGenerateSummary(item)}
                          disabled={loading}
                        >
                          Generate Summary
                        </Button>
                      </div>
                      {item.summary ? (
                        <pre className="mt-2 text-xs text-cyan-50/80 bg-slate-950/40 rounded-2xl p-3 overflow-auto">
                          {item.summary}
                        </pre>
                      ) : null}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {active ? (
        <GlassCard>
          <h3 className="text-lg font-semibold text-cyan-50 mb-2">
            Active Call
          </h3>
          <p className="text-sm text-cyan-100/70">
            {active.referenceName} &mdash; {active.status}
          </p>
        </GlassCard>
      ) : null}
    </Shell>
  );
}
