import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />
      <div className="absolute inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            initial={{
              x:
                Math.random() *
                (typeof window !== "undefined" ? window.innerWidth : 1000),
              y:
                Math.random() *
                (typeof window !== "undefined" ? window.innerHeight : 1000),
              opacity: Math.random() * 0.5 + 0.3,
            }}
            animate={{
              y: [
                null,
                Math.random() *
                  (typeof window !== "undefined" ? window.innerHeight : 1000),
              ],
              opacity: [null, Math.random() * 0.5 + 0.3, 0],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
    </div>
  );
}

export function GlassCard({
  children,
  onClick,
  className = "",
  glow = false,
}) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.01, y: -2 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 ${
        onClick
          ? "cursor-pointer hover:border-cyan-400/40 hover:bg-slate-900/60"
          : ""
      } ${glow ? "shadow-[0_0_60px_rgba(6,182,212,0.15)]" : "shadow-xl shadow-black/20"} ${className}`}
    >
      {glow && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 blur-2xl -z-10" />
      )}
      {children}
    </motion.div>
  );
}

const BUTTON_STYLES = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30",
  secondary:
    "bg-slate-800/80 backdrop-blur-xl border border-cyan-500/30 text-cyan-100 hover:bg-slate-700/80 hover:border-cyan-400/40",
  ghost:
    "text-cyan-100/70 hover:text-cyan-100 hover:bg-slate-800/50",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  loading = false,
  className = "",
  disabled = false,
  type = "button",
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={loading || disabled}
      className={`px-5 py-3 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        BUTTON_STYLES[variant] || BUTTON_STYLES.primary
      } ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );
}

const BADGE_STYLES = {
  success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  warning: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  default: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  danger: "bg-red-500/20 text-red-300 border-red-500/40",
  info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
};

export function Badge({ children, variant = "default", icon: Icon }) {
  return (
    <span
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-sm flex items-center gap-1.5 ${
        BADGE_STYLES[variant] || BADGE_STYLES.default
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}

export function ScoreRing({ score, size = "lg" }) {
  if (typeof score !== "number") {
    return null;
  }
  const radius = size === "lg" ? 70 : 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const sizeClass = size === "lg" ? "w-48 h-48" : "w-24 h-24";
  const textSizeClass = size === "lg" ? "text-5xl" : "text-2xl";
  const subTextSizeClass = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className={`relative ${sizeClass}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size === "lg" ? "96" : "48"}
          cy={size === "lg" ? "96" : "48"}
          r={radius}
          stroke="currentColor"
          strokeWidth={size === "lg" ? "12" : "6"}
          fill="none"
          className="text-slate-800/50"
        />
        <motion.circle
          cx={size === "lg" ? "96" : "48"}
          cy={size === "lg" ? "96" : "48"}
          r={radius}
          stroke={getColor()}
          strokeWidth={size === "lg" ? "12" : "6"}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className={`${textSizeClass} font-bold text-white`}
        >
          {score}
        </motion.div>
        <div className={`${subTextSizeClass} text-cyan-400/60`}>/ 100</div>
      </div>
    </div>
  );
}

export function FileUpload({
  label,
  accept,
  file,
  setFile,
  icon: Icon = FileText,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div>
      {label ? (
        <label className="block text-sm font-medium text-cyan-100/90 mb-3">
          {label}
        </label>
      ) : null}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
          dragActive
            ? "border-cyan-400 bg-cyan-500/10"
            : file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-cyan-500/30 bg-slate-800/30 hover:border-cyan-400/50"
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          {file ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-emerald-300 mb-1">
                {file.name}
              </p>
              <p className="text-xs text-cyan-100/50">
                File uploaded successfully
              </p>
            </>
          ) : (
            <>
              <Icon className="w-12 h-12 text-cyan-400/60 mx-auto mb-3" />
              <p className="text-sm font-medium text-cyan-100/80 mb-1">
                Drag &amp; drop or click to upload
              </p>
              {accept ? (
                <p className="text-xs text-cyan-100/50">{accept}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

