import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Briefcase } from "lucide-react";
import { completeProfile } from "../services/backendApi";
import { getUser, needsProfileCompletion, setAuthSession } from "../lib/auth";
import { AnimatedBackground } from "../components/UnmaskUI";

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const user = getUser();

  const [company, setCompany] = useState(user?.company || "");
  const [position, setPosition] = useState(user?.position || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user && !needsProfileCompletion(user)) {
    navigate("/candidates", { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await completeProfile({ company, position });
      setAuthSession(data);
      navigate("/candidates", { replace: true });
    } catch (err) {
      setError(err.message || "Profile completion failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="u-auth-wrap">
      <AnimatedBackground />
      <div className="u-auth-card relative z-10">
        <div className="u-auth-brand">
          <div className="u-auth-logo">U</div>
          <div>
            <div className="u-auth-name">UNMASK</div>
            <div className="u-auth-subname">Complete Profile</div>
          </div>
        </div>

        <div className="u-auth-title">Finish onboarding</div>
        <div className="u-auth-sub">
          Google sign-in doesn’t include company and position. Add them once to
          continue.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="u-input-group">
            <div className="u-input-label">Company</div>
            <div style={{ position: "relative" }}>
              <Building2
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
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="u-input-field"
                style={{ paddingLeft: 36 }}
                placeholder="Your company"
                required
              />
            </div>
          </div>

          <div className="u-input-group">
            <div className="u-input-label">Position</div>
            <div style={{ position: "relative" }}>
              <Briefcase
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
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="u-input-field"
                style={{ paddingLeft: 36 }}
                placeholder="Recruiter / HR / Talent Partner"
                required
              />
            </div>
          </div>

          {error ? <div className="u-auth-error">{error}</div> : null}

          <button className="u-auth-submit" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

