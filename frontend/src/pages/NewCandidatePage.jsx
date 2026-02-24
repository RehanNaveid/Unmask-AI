import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Github, ArrowLeft, FileText, Linkedin } from "lucide-react";
import Shell from "../components/Shell";
import { createCandidate } from "../services/backendApi";
import { GlassCard, Button, FileUpload } from "../components/UnmaskUI";

export default function NewCandidatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [linkedinFile, setLinkedinFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function next() {
    if (name && email && githubUsername) {
      setStep(2);
    }
  }

  async function submit() {
    if (!cvFile) return;
    setLoading(true);
    setError("");
    try {
      await createCandidate({
        name,
        email,
        githubUsername,
        cvFile,
        linkedinFile,
      });
      navigate("/candidates");
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="max-w-[900px] mx-auto">
        <div className="mb-8">
          <Button
            onClick={() => navigate("/candidates")}
            variant="ghost"
            icon={ArrowLeft}
            className="mb-6"
          >
            Back to Candidates
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <Plus className="w-8 h-8 text-cyan-400" />
            <h2 className="text-3xl md:text-4xl font-bold text-cyan-50">
              Add New Candidate
            </h2>
          </div>
          <p className="text-cyan-100/60 text-sm md:text-base">
            Upload candidate information for AI analysis.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${
              step >= 1
                ? "bg-cyan-500/20 border border-cyan-400/40"
                : "bg-slate-800/30 border border-slate-700/30"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 1
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              1
            </div>
            <span
              className={`font-medium ${
                step >= 1 ? "text-cyan-100" : "text-slate-400"
              }`}
            >
              Basic Info
            </span>
          </div>
          <div
            className={`h-0.5 flex-1 ${
              step >= 2 ? "bg-cyan-500" : "bg-slate-700"
            }`}
          />
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${
              step >= 2
                ? "bg-cyan-500/20 border border-cyan-400/40"
                : "bg-slate-800/30 border border-slate-700/30"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 2
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              2
            </div>
            <span
              className={`font-medium ${
                step >= 2 ? "text-cyan-100" : "text-slate-400"
              }`}
            >
              Upload Files
            </span>
          </div>
        </div>

        <GlassCard glow>
          {step === 1 ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-cyan-50 mb-2">
                Candidate Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-cyan-100/90 mb-2">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-100/90 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-100/90 mb-2">
                  GitHub Username
                </label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60" />
                  <input
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={next}
                variant="primary"
                disabled={!name || !email || !githubUsername}
                className="w-full mt-4"
              >
                Continue to Upload Files
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-cyan-50 mb-2">
                Upload Documents
              </h3>

              <FileUpload
                label="Resume / CV (Required)"
                accept=".pdf,.doc,.docx"
                file={cvFile}
                setFile={setCvFile}
                icon={FileText}
              />

              <FileUpload
                label="LinkedIn PDF (Optional)"
                accept=".pdf"
                file={linkedinFile}
                setFile={setLinkedinFile}
                icon={Linkedin}
              />

              {error ? (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-3">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="secondary"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={submit}
                  variant="primary"
                  loading={loading}
                  disabled={!cvFile}
                  className="flex-1"
                >
                  {loading ? "Uploading..." : "Create Candidate"}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </Shell>
  );
}
