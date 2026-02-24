import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Zap } from "lucide-react";
import { login } from "../services/backendApi";
import { setSession } from "../lib/auth";
import {
  AnimatedBackground,
  GlassCard,
  Button,
} from "../components/UnmaskUI";

export default function LoginPage({ onSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      });
      onSuccess();
      navigate("/candidates");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 text-cyan-50">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50"
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3 tracking-tight"
          >
            UNMASK
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-cyan-100/60 text-sm mb-2"
          >
            AI-Powered Hiring Intelligence Platform
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-300 backdrop-blur-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Use your HR account credentials
          </motion.div>
        </div>

        <GlassCard glow>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-cyan-100/80 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-100/80 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-3">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full text-base py-4"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
