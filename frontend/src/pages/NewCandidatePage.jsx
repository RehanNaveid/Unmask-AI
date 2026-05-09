import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Github,
  ArrowLeft,
  FileText,
  Linkedin,
  Check,
  Sparkles,
} from "lucide-react";
import Shell from "../components/Shell";
import { createCandidate } from "../services/backendApi";
import { Button } from "../components/UnmaskUI";
import UploadZone from "../components/UploadZone";

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
      <div className="u-add-layout">
        <button
          className="u-action-btn"
          type="button"
          onClick={() => navigate("/candidates")}
          style={{ marginBottom: "1.5rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Candidates
        </button>

        <div className="u-page-title" style={{ marginBottom: "0.5rem" }}>
          <Plus
            className="w-5 h-5"
            style={{ color: "var(--u-accent)", verticalAlign: "-2px" }}
          />{" "}
          Add New Candidate
        </div>
        <div className="u-page-sub" style={{ marginBottom: "2rem" }}>
          Upload candidate information for AI analysis
        </div>

        <div className="u-step-header">
          <div className="u-step-item">
            <div className={`u-step-num ${step > 1 ? "done" : "active"}`}>
              {step > 1 ? <Check className="w-4 h-4" /> : 1}
            </div>
            <div className={`u-step-label ${step >= 1 ? "active" : ""}`}>
              Basic Info
            </div>
          </div>
          <div className="u-step-connector" />
          <div className="u-step-item">
            <div className={`u-step-num ${step >= 2 ? "active" : ""}`}>2</div>
            <div className={`u-step-label ${step >= 2 ? "active" : ""}`}>
              Upload Files
            </div>
          </div>
        </div>

        <div className="u-form-section">
          {step === 1 ? (
            <>
              <div className="u-form-section-title">Candidate Information</div>

              <div className="u-input-group">
                <div className="u-input-label">Full Name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="u-input-field"
                  required
                />
              </div>

              <div className="u-input-group">
                <div className="u-input-label">Email Address</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="u-input-field"
                  required
                />
              </div>

              <div className="u-input-group">
                <div className="u-input-label">GitHub Username</div>
                <div style={{ position: "relative" }}>
                  <Github
                    className="w-4 h-4"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--u-text3)",
                    }}
                  />
                  <input
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="johndoe"
                    className="u-input-field"
                    style={{ paddingLeft: 36 }}
                    required
                  />
                </div>
              </div>

              <div className="u-form-actions">
                <button
                  className="u-btn-form primary"
                  type="button"
                  onClick={next}
                  disabled={!name || !email || !githubUsername}
                >
                  Continue to Upload Files
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="u-form-section-title">Upload Documents</div>

              <div className="u-input-group">
                <div className="u-input-label">
                  Resume / CV <span style={{ color: "var(--u-danger)" }}>*</span>
                </div>
                <UploadZone
                  accept=".pdf,.doc,.docx"
                  file={cvFile}
                  onFile={setCvFile}
                  icon={<FileText className="w-8 h-8" />}
                  subtext=".pdf, .doc, .docx"
                />
              </div>

              <div className="u-input-group" style={{ marginTop: "1rem" }}>
                <div className="u-input-label">
                  LinkedIn PDF{" "}
                  <span style={{ color: "var(--u-text3)" }}>(Optional)</span>
                </div>
                <UploadZone
                  accept=".pdf"
                  file={linkedinFile}
                  onFile={setLinkedinFile}
                  icon={<Linkedin className="w-7 h-7" />}
                  subtext=".pdf"
                />
              </div>

              {error ? (
                <div className="u-auth-error" style={{ marginTop: 12 }}>
                  {error}
                </div>
              ) : null}

              <div className="u-form-actions">
                <button
                  className="u-btn-form"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="u-btn-form primary"
                  type="button"
                  onClick={submit}
                  disabled={!cvFile || loading}
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Uploading..." : "Create Candidate & Analyze"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
