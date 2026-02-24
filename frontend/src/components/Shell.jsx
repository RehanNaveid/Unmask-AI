import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, LogOut, Home } from "lucide-react";
import { clearSession, getUser } from "../lib/auth";
import { AnimatedBackground, Button } from "./UnmaskUI";

export default function Shell({ children }) {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-50 relative overflow-hidden">
      <AnimatedBackground />

      <header className="bg-slate-900/60 backdrop-blur-2xl border-b border-cyan-500/20 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/candidates" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-cyan-100 tracking-tight">
                  UNMASK
                </div>
                <div className="text-xs text-cyan-400/60">
                  AI Hiring Intelligence
                </div>
              </div>
            </Link>

            <nav className="flex items-center gap-3 text-sm">
              <Link
                to="/candidates"
                aria-label="Home"
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-cyan-100/80 hover:text-cyan-100 hover:bg-slate-800/60 transition-colors"
              >
                <Home className="w-5 h-5" />
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-cyan-100/70">
              {user?.fullName || user?.email || "HR"}
            </span>
            <Button
              variant="ghost"
              icon={LogOut}
              onClick={logout}
              className="text-xs px-3 py-2"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
