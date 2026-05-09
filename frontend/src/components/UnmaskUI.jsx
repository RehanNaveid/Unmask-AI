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
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,212,255,0.10) 0%, transparent 60%), var(--u-bg)",
        }}
      />
      <div className="absolute inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ background: "var(--u-accent)" }}
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
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
        }}
      />
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
      className={`relative rounded-3xl p-6 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{
        background: "var(--u-surface)",
        border: "1px solid var(--u-border)",
        backdropFilter: "blur(16px)",
        boxShadow: glow
          ? "0 0 60px rgba(0,212,255,0.10)"
          : "0 10px 40px rgba(0,0,0,0.25)",
      }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-3xl blur-2xl -z-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(0,212,255,0.10))",
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

const BUTTON_STYLES = {
  primary:
    "",
  secondary:
    "",
  ghost:
    "",
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
      className={`px-5 py-3 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${className}`}
      style={{
        opacity: loading || disabled ? 0.6 : 1,
        cursor: loading || disabled ? "not-allowed" : "pointer",
        borderRadius: 12,
        border:
          variant === "ghost"
            ? "1px solid transparent"
            : variant === "secondary"
            ? "1px solid var(--u-border2)"
            : "1px solid var(--u-accent)",
        background:
          variant === "ghost"
            ? "transparent"
            : variant === "secondary"
            ? "var(--u-surface)"
            : "var(--u-accent)",
        color:
          variant === "primary"
            ? "#000"
            : variant === "ghost"
            ? "var(--u-text2)"
            : "var(--u-text)",
      }}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );
}

const BADGE_STYLES = {
  success: "",
  warning: "",
  default: "",
  danger: "",
  info: "",
};

export function Badge({ children, variant = "default", icon: Icon }) {
  const styleMap = {
    success: {
      background: "rgba(6,255,165,0.10)",
      color: "var(--u-accent3)",
      border: "1px solid rgba(6,255,165,0.25)",
    },
    warning: {
      background: "rgba(251,191,36,0.10)",
      color: "var(--u-warn)",
      border: "1px solid rgba(251,191,36,0.25)",
    },
    danger: {
      background: "rgba(255,77,109,0.12)",
      color: "var(--u-danger)",
      border: "1px solid rgba(255,77,109,0.25)",
    },
    info: {
      background: "rgba(0,212,255,0.10)",
      color: "var(--u-accent)",
      border: "1px solid rgba(0,212,255,0.25)",
    },
    default: {
      background: "rgba(255,255,255,0.06)",
      color: "var(--u-text2)",
      border: "1px solid var(--u-border)",
    },
  };
  return (
    <span
      className="px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5"
      style={styleMap[variant] || styleMap.default}
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
        <div className="text-center pointer-events-none">
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
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
}

