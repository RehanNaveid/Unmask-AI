import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import env from "../config/env";
import { googleLogin, login } from "../services/backendApi";
import { getUser, needsProfileCompletion, setAuthSession, setSession } from "../lib/auth";
import { AnimatedBackground } from "../components/UnmaskUI";

export default function LoginPage({ onSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const googleClientId = env.googleClientId;
  const canUseGoogle = useMemo(() => Boolean(googleClientId), [googleClientId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login({ email, password });
      setSession(data.token, {
        email: data.email,
        fullName: data.fullName,
        roles: data.roles,
        provider: data.provider,
        onboardingCompleted: data.onboardingCompleted,
        company: data.company,
        position: data.position,
      });
      onSuccess();
      navigate(needsProfileCompletion(getUser()) ? "/complete-profile" : "/candidates");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canUseGoogle) return;

    let cancelled = false;
    let timer = null;

    function initGoogle() {
      if (cancelled) return;
      const google = window.google;
      if (!google?.accounts?.id) return false;

      google.accounts.id.initialize({
        client_id: googleClientId,
        ux_mode: "popup",
        callback: async (response) => {
          setGoogleLoading(true);
          setError("");
          try {
            const data = await googleLogin(response.credential);
            setAuthSession(data);
            onSuccess();
            navigate(needsProfileCompletion(getUser()) ? "/complete-profile" : "/candidates");
          } catch (err) {
            setError(err.message || "Google login failed");
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 340,
        });
      }
      setGoogleReady(true);
      return true;
    }

    function waitForGoogle(maxAttempts = 40) {
      let attempts = 0;
      timer = window.setInterval(() => {
        attempts += 1;
        const ok = initGoogle();
        if (ok || attempts >= maxAttempts) {
          window.clearInterval(timer);
          timer = null;
          if (!ok && !cancelled) {
            setError("Google SDK failed to initialize");
          }
        }
      }, 100);
    }

    // Load GIS SDK once (robust against existing-but-not-ready script)
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      const ok = initGoogle();
      if (!ok) {
        waitForGoogle();
      }
      return () => {
        cancelled = true;
        if (timer) window.clearInterval(timer);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const ok = initGoogle();
      if (!ok) {
        waitForGoogle();
      }
    };
    script.onerror = () => !cancelled && setError("Google SDK failed to load");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [canUseGoogle, googleClientId, navigate, onSuccess]);

  return (
    <div className="u-auth-wrap">
      <AnimatedBackground />

      <div className="u-auth-card relative z-10">
        <div className="u-auth-brand">
          <div className="u-auth-logo">U</div>
          <div>
            <div className="u-auth-name">UNMASK</div>
            <div className="u-auth-subname">AI Hiring Intelligence</div>
          </div>
        </div>

        <div className="u-auth-title">Sign in</div>
        <div className="u-auth-sub">
          Use your HR account credentials to access the candidates workspace.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="u-input-group">
            <div className="u-input-label">Email Address</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="u-input-field"
              required
            />
          </div>

          <div className="u-input-group">
            <div className="u-input-label">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="u-input-field"
              required
            />
          </div>

          {error ? <div className="u-auth-error">{error}</div> : null}

          <button className="u-auth-submit" type="submit" disabled={loading}>
            <LogIn className="w-4 h-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {canUseGoogle ? (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "12px 0",
                color: "var(--u-text3)",
                fontSize: 12,
              }}
            >
              <div style={{ height: 1, background: "var(--u-border)", flex: 1 }} />
              <div>or</div>
              <div style={{ height: 1, background: "var(--u-border)", flex: 1 }} />
            </div>
            <div
              ref={googleBtnRef}
              style={{
                display: "flex",
                justifyContent: "center",
                opacity: googleLoading ? 0.6 : 1,
                pointerEvents: googleLoading ? "none" : "auto",
              }}
            />
            {!googleReady ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--u-text3)" }}>
                Loading Google sign-in…
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--u-text3)" }}>
            Google sign-in is unavailable because `VITE_GOOGLE_CLIENT_ID` is not set.
          </div>
        )}
      </div>
    </div>
  );
}
