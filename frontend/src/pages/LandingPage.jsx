import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  FileText,
  Github,
  ShieldCheck,
  Radar,
  PhoneCall,
  MessageSquare,
  ExternalLink,
  Linkedin,
} from "lucide-react";
import { isAuthenticated } from "../lib/auth";

export default function LandingPage() {
  const navigate = useNavigate();
  const authed = useMemo(() => isAuthenticated(), []);

  function goApp() {
    navigate(authed ? "/candidates" : "/login");
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ background: "var(--u-bg)", minHeight: "100vh" }}>
      <nav className="u-nav">
        <div className="u-nav-brand" onClick={() => scrollToId("top")}>
          <div className="u-nav-logo">U</div>
          <div>
            <div className="u-nav-name">UNMASK</div>
            <div className="u-nav-sub">AI Hiring Intelligence</div>
          </div>
        </div>

        <div className="u-nav-links" aria-label="Landing navigation">
          <button className="u-nav-link" onClick={() => scrollToId("product")}>
            Product
          </button>
          <button
            className="u-nav-link"
            onClick={() => scrollToId("intelligence")}
          >
            Intelligence
          </button>
          <button className="u-nav-link" onClick={() => scrollToId("workflow")}>
            Workflow
          </button>
          <button className="u-nav-link" onClick={() => scrollToId("about")}>
            About
          </button>
          <button className="u-nav-link" onClick={() => scrollToId("contact")}>
            Contact
          </button>
        </div>

        <div className="u-nav-actions">
          <button className="u-btn-ghost" onClick={() => navigate("/login")}>
            Log in
          </button>
          <button className="u-btn-primary" onClick={goApp}>
            Get started →
          </button>
        </div>
      </nav>

      <div id="top" className="u-hero">
        <div className="u-hero-bg" />
        <div className="u-hero-badge">
          <div className="u-hero-dot" />
          LLM Council · Multi-Agent Verification
        </div>
        <h1>
          Stop hiring the
          <br />
          candidate they invented
        </h1>
        <p>
          Unmask uses an AI council of verification agents to detect inflated
          resumes, fake GitHub activity, suspicious project claims, and
          misleading credentials — before the first interview.
        </p>

        <div className="u-hero-actions">
          <button className="u-btn-hero" onClick={goApp}>
            <Brain className="w-5 h-5" />
            Start verifying candidates
          </button>
          <button className="u-btn-hero-ghost" onClick={() => scrollToId("product")}>
            Watch demo
          </button>
        </div>

        <div className="u-stats-strip">
          <div className="u-stat-item">
            <div className="u-stat-num">94%</div>
            <div className="u-stat-label">Detection accuracy</div>
          </div>
          <div className="u-stat-item">
            <div className="u-stat-num">3.2×</div>
            <div className="u-stat-label">Faster screening</div>
          </div>
          <div className="u-stat-item">
            <div className="u-stat-num">30 sec</div>
            <div className="u-stat-label">Avg analysis time</div>
          </div>
          <div className="u-stat-item">
            <div className="u-stat-num">3 agents</div>
            <div className="u-stat-label">LLM council</div>
          </div>
        </div>
      </div>

      <div id="product" className="u-section">
        <div className="u-section-label">What we verify</div>
        <div className="u-section-title">
          Every signal. Every claim.
          <br />
          Evidence first.
        </div>
        <div className="u-section-sub">
          Six intelligence modules work in parallel to cross-verify every
          dimension of a candidate&apos;s background.
        </div>

        <div className="u-feature-grid">
          <div className="u-feature-card">
            <div className="u-feat-icon blue">
              <FileText className="w-5 h-5" />
            </div>
            <h3>Resume intelligence</h3>
            <p>
              AI cross-references every claim against verifiable evidence. Job
              titles, tenure, tech stacks — all scrutinized.
            </p>
          </div>

          <div className="u-feature-card">
            <div className="u-feat-icon purple">
              <Github className="w-5 h-5" />
            </div>
            <h3>GitHub forensics</h3>
            <p>
              Analyzes commit patterns, code quality, contribution authenticity,
              and repo ownership claims.
            </p>
          </div>

          <div className="u-feature-card">
            <div className="u-feat-icon green">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3>Project claim verification</h3>
            <p>
              Checks whether described projects are technically believable,
              plausible in timeline, and authorship-consistent.
            </p>
          </div>

          <div className="u-feature-card">
            <div className="u-feat-icon amber">
              <Radar className="w-5 h-5" />
            </div>
            <h3>Credibility scoring</h3>
            <p>
              Multi-dimensional score across honesty, technical depth,
              consistency, and professional plausibility.
            </p>
          </div>

          <div className="u-feature-card">
            <div className="u-feat-icon red">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3>AI reference calls</h3>
            <p>
              Automated outbound calls to references with real-time
              transcription, red flag detection, and sentiment analysis.
            </p>
          </div>

          <div className="u-feature-card">
            <div className="u-feat-icon teal">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3>Interview generation</h3>
            <p>
              Generates targeted technical questions based on specific claims to
              stress-test during interviews.
            </p>
          </div>
        </div>
      </div>

      <div id="intelligence" className="u-council-section">
        <div className="u-council-inner">
          <div className="u-section-label">The intelligence engine</div>
          <div className="u-section-title" style={{ marginBottom: "0.75rem" }}>
            The LLM Council
          </div>
          <div className="u-section-sub">
            Seven specialized AI agents deliberate in parallel. No single model
            decides — consensus through conflict.
          </div>

          <div className="u-council-wrap">
            <div className="u-council-agents">
              <div className="u-agent-row">
                <div className="u-agent-dot" style={{ background: "#00d4ff" }} />
                <div>
                  <div className="u-agent-name">ResumeSherlock</div>
                  <div className="u-agent-sub">Timeline &amp; consistency analysis</div>
                </div>
                <div className="u-agent-desc">Active</div>
              </div>
              <div className="u-agent-row">
                <div className="u-agent-dot" style={{ background: "#a78bfa" }} />
                <div>
                  <div className="u-agent-name">GitForensics</div>
                  <div className="u-agent-sub">Repository &amp; commit verification</div>
                </div>
                <div className="u-agent-desc">Active</div>
              </div>
              <div className="u-agent-row">
                <div className="u-agent-dot" style={{ background: "#06ffa5" }} />
                <div>
                  <div className="u-agent-name">ClaimBuster</div>
                  <div className="u-agent-sub">Technical claim plausibility</div>
                </div>
                <div className="u-agent-desc">Active</div>
              </div>
              <div className="u-agent-row">
                <div className="u-agent-dot" style={{ background: "#fbbf24" }} />
                <div>
                  <div className="u-agent-name">StackAuditor</div>
                  <div className="u-agent-sub">Tech stack depth assessment</div>
                </div>
                <div className="u-agent-desc">Active</div>
              </div>
              <div className="u-agent-row">
                <div className="u-agent-dot" style={{ background: "#f472b6" }} />
                <div>
                  <div className="u-agent-name">RedFlagSentinel</div>
                  <div className="u-agent-sub">Anomaly &amp; deception detection</div>
                </div>
                <div className="u-agent-desc">Active</div>
              </div>
              <div className="u-agent-row">
                <div className="u-agent-dot" style={{ background: "#fb923c" }} />
                <div>
                  <div className="u-agent-name">ReferenceAnalyst</div>
                  <div className="u-agent-sub">Call sentiment &amp; credibility</div>
                </div>
                <div className="u-agent-desc">Active</div>
              </div>
              <div className="u-agent-row">
                <div className="u-agent-dot" style={{ background: "#67e8f9" }} />
                <div>
                  <div className="u-agent-name">TrustOrchestrator</div>
                  <div className="u-agent-sub">Final consensus &amp; scoring</div>
                </div>
                <div className="u-agent-desc">Active</div>
              </div>
            </div>

            <div className="u-verdict-panel">
              <div className="u-verdict-header">Council Verdict · Sample Candidate</div>
              <div className="u-score-ring-wrap">
                <div className="u-score-ring">
                  <div className="u-score-num">23</div>
                  <div className="u-score-label">Trust</div>
                </div>
                <div>
                  <div className="u-verdict-title">⚠ HIGH RISK — Do Not Proceed</div>
                  <div className="u-verdict-desc">
                    6 of 7 agents flagged significant inconsistencies. Consensus:
                    candidate&apos;s claims are unreliable.
                  </div>
                </div>
              </div>
              <div className="u-verdict-flags">
                <div className="u-flag-item">
                  <div className="u-flag-icon" style={{ color: "var(--u-danger)" }}>
                    ✕
                  </div>
                  <div className="u-flag-text">
                    <strong>GitHub activity fabricated</strong> — Commits show
                    single-session bulk pushes. No organic history.
                  </div>
                </div>
                <div className="u-flag-item">
                  <div className="u-flag-icon" style={{ color: "var(--u-danger)" }}>
                    ✕
                  </div>
                  <div className="u-flag-text">
                    <strong>React Native claim suspect</strong> — No evidence of RN
                    usage across 3 years of repos.
                  </div>
                </div>
                <div className="u-flag-item">
                  <div className="u-flag-icon" style={{ color: "var(--u-warn)" }}>
                    !
                  </div>
                  <div className="u-flag-text">
                    <strong>Reference call negative</strong> — Respondent: “not
                    reliable at all”, would not rehire.
                  </div>
                </div>
              </div>
              <div className="u-verdict-badge">Reject recommendation</div>
            </div>
          </div>
        </div>
      </div>

      <div id="workflow" className="u-section" style={{ paddingTop: 0 }}>
        <div className="u-section-label">Recruiter workflow</div>
        <div className="u-section-title">Evidence-first screening, end-to-end</div>
        <div className="u-section-sub">
          Upload a candidate once. The council verifies claims, produces a verdict,
          and generates interview-ready outputs you can use immediately.
        </div>
        <div className="u-feature-grid">
          <div className="u-feature-card">
            <div className="u-feat-icon blue">
              <FileText className="w-5 h-5" />
            </div>
            <h3>Upload &amp; parse</h3>
            <p>Resume + LinkedIn PDF are parsed into structured evidence.</p>
          </div>
          <div className="u-feature-card">
            <div className="u-feat-icon purple">
              <Brain className="w-5 h-5" />
            </div>
            <h3>Council deliberation</h3>
            <p>Specialized agents cross-check each claim in parallel.</p>
          </div>
          <div className="u-feature-card">
            <div className="u-feat-icon green">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3>Verdict &amp; next steps</h3>
            <p>Clear flags, credibility score, and interview questions.</p>
          </div>
        </div>
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button className="u-btn-hero" onClick={goApp}>
            <Brain className="w-5 h-5" />
            Launch Unmask
          </button>
        </div>
      </div>

      <div id="about" className="u-section" style={{ paddingTop: 0 }}>
        <div className="u-section-label">Mission</div>
        <div className="u-section-title">
          Trust is the foundation of every great hire
        </div>
        <div className="u-section-sub">
          We built Unmask to give recruiters the evidence they need to make
          confident decisions — without bias, without guesswork.
        </div>
      </div>

      <footer id="contact" className="u-footer">
        <div className="u-footer-inner">
          <div className="u-section-label" style={{ marginBottom: 0 }}>
            Contact / Portfolio
          </div>
          <div className="u-section-title" style={{ marginBottom: 0 }}>
            Built by you, showcased professionally
          </div>
          <div className="u-section-sub" style={{ margin: "0 auto" }}>
            Want to review the implementation, collaborate, or discuss the build?
            Reach out or explore the code.
          </div>
          <div className="u-footer-links">
            <a
              className="u-action-btn"
              href="https://github.com/RehanNaveid/Unmask-AI"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="w-4 h-4" /> GitHub <ExternalLink className="w-4 h-4" />
            </a>
            <a
              className="u-action-btn"
              href="https://www.linkedin.com/in/rehan-naveid-349b11256/"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin className="w-4 h-4" /> LinkedIn{" "}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div style={{ fontSize: 12, color: "var(--u-text3)" }}>
            © {new Date().getFullYear()} UNMASK AI — recruiter-first verification UX.
          </div>
        </div>
      </footer>
    </div>
  );
}

