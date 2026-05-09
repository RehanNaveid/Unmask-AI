import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Phone, ShieldCheck, Users, LogOut } from "lucide-react";
import { clearSession, getUser } from "../lib/auth";
import { AnimatedBackground, Button } from "./UnmaskUI";

export default function Shell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  function logout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--u-bg)", color: "var(--u-text)" }}
    >
      <AnimatedBackground />

      <div className="u-app-layout relative z-10">
        <aside className="u-sidebar">
          <div className="u-sidebar-workspace">
            <div className="u-sidebar-muted">Workspace</div>
            <div className="u-sidebar-who">
              {user?.fullName || user?.email || "HR One"} · Recruiter
            </div>
          </div>

          <div className="u-sidebar-section">Recruiting</div>

          <Link
            to="/candidates"
            className={`u-sidebar-item ${
              location.pathname === "/candidates" ? "active" : ""
            }`}
          >
            <Users className="w-4 h-4" />
            Candidates
          </Link>

          <div className="u-sidebar-item" aria-disabled="true" style={{ opacity: 0.6, cursor: "default" }}>
            <ShieldCheck className="w-4 h-4" />
            AI Analysis
          </div>

          <div className="u-sidebar-item" aria-disabled="true" style={{ opacity: 0.6, cursor: "default" }}>
            <Phone className="w-4 h-4" />
            Reference Calls
          </div>

          <div className="u-sidebar-section" style={{ marginTop: "auto" }}>
            Account
          </div>

          <div className="u-sidebar-item" onClick={logout} role="button" tabIndex={0}>
            <LogOut className="w-4 h-4" />
            Logout
          </div>
        </aside>

        <main className="u-main">{children}</main>
      </div>
    </div>
  );
}
