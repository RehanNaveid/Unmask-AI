import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Mail, Github, Phone, Loader2, ChevronRight, Plus, Settings, LogOut, ChevronDown, AlertCircle, AlertTriangle, Flag, CheckCircle2, ExternalLink, FileText, Building, UserCircle, Search, Filter, X, Check, Upload, Clock, XCircle, MessageSquare, Copy, RefreshCw, Sparkles, Zap, TrendingUp, Award, Brain, Target, ArrowLeft, File, Linkedin } from 'lucide-react';

export default function UnmaskDemo() {
  const [page, setPage] = useState('login');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidates, setCandidates] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com', github: 'johndoe', score: 85, status: 'verified', avatar: 'JD' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', github: 'janesmith', score: 62, status: 'partial', avatar: 'JS' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', github: 'bobwilson', score: null, status: 'unverified', avatar: 'BW' },
  ]);

  const analysis = {
    score: 85,
    recommendation: 'Strong candidate with verified projects and solid GitHub presence.',
    projects: [
      { name: 'E-commerce Platform', status: 'verified', confidence: 95, repo: 'github.com/johndoe/ecommerce', evidence: 'Repository found with matching description, technologies, and commit history aligning with resume dates.' },
      { name: 'Mobile Banking App', status: 'verified', confidence: 88, repo: 'github.com/johndoe/mobile-banking', evidence: 'React Native project with significant contributions. Timeline matches claimed work period.' },
      { name: 'AI Chatbot', status: 'partial', confidence: 65, repo: 'github.com/johndoe/chatbot', evidence: 'Project exists but contribution level lower than claimed. May have been team project with limited individual contribution.' },
    ],
    redFlags: ['Lower contribution than claimed on AI Chatbot'],
    yellowFlags: ['Gap in GitHub activity June-Aug 2022', 'Limited open source contributions'],
    questions: [
      'Walk through architecture of E-commerce Platform',
      'React Native challenges in Mobile Banking App',
      'Explain the GitHub activity gap in 2022',
      'Your specific role in the AI Chatbot project',
      'Discuss your open source contribution philosophy',
    ],
  };

  const calls = [
    { id: '1', name: 'Sarah Johnson', phone: '+1 555-123-4567', status: 'completed', company: 'TechCorp' },
    { id: '2', name: 'Michael Chen', phone: '+1 555-987-6543', status: 'completed', company: 'Innovation Labs' },
  ];

  // Animated background component
  const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />
      <div className="absolute inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: Math.random() * 0.5 + 0.3,
            }}
            animate={{
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
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
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
    </div>
  );

  // Components
  const GlassCard = ({ children, onClick, className = '', glow = false }) => (
    <motion.div
      whileHover={onClick ? { scale: 1.01, y: -2 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 ${
        onClick ? 'cursor-pointer hover:border-cyan-400/40 hover:bg-slate-900/60' : ''
      } ${glow ? 'shadow-[0_0_60px_rgba(6,182,212,0.15)]' : 'shadow-xl shadow-black/20'} ${className}`}
    >
      {glow && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 blur-2xl -z-10" />
      )}
      {children}
    </motion.div>
  );

  const Button = ({ children, onClick, variant = 'primary', icon: Icon, loading = false, className = '', disabled = false }) => {
    const styles = {
      primary: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30',
      secondary: 'bg-slate-800/80 backdrop-blur-xl border border-cyan-500/30 text-cyan-100 hover:bg-slate-700/80 hover:border-cyan-400/40',
      ghost: 'text-cyan-100/70 hover:text-cyan-100 hover:bg-slate-800/50',
    };
    return (
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={onClick}
        disabled={loading || disabled}
        className={`px-5 py-3 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && Icon && <Icon className="w-4 h-4" />}
        {children}
      </motion.button>
    );
  };

  const Badge = ({ children, variant, icon: Icon }) => {
    const styles = {
      success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      default: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      danger: 'bg-red-500/20 text-red-300 border-red-500/40',
      info: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    };
    return (
      <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-sm flex items-center gap-1.5 ${styles[variant]}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {children}
      </span>
    );
  };

  const ScoreRing = ({ score, size = 'lg' }) => {
    const radius = size === 'lg' ? 70 : 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    const getColor = () => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <div className={`relative ${size === 'lg' ? 'w-48 h-48' : 'w-24 h-24'}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size === 'lg' ? '96' : '48'}
            cy={size === 'lg' ? '96' : '48'}
            r={radius}
            stroke="currentColor"
            strokeWidth={size === 'lg' ? '12' : '6'}
            fill="none"
            className="text-slate-800/50"
          />
          <motion.circle
            cx={size === 'lg' ? '96' : '48'}
            cy={size === 'lg' ? '96' : '48'}
            r={radius}
            stroke={getColor()}
            strokeWidth={size === 'lg' ? '12' : '6'}
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
            className={`${size === 'lg' ? 'text-5xl' : 'text-2xl'} font-bold text-white`}
          >
            {score}
          </motion.div>
          <div className={`${size === 'lg' ? 'text-sm' : 'text-xs'} text-cyan-400/60`}>/ 100</div>
        </div>
      </div>
    );
  };

  const FileUpload = ({ label, accept, file, setFile, icon: Icon = FileText }) => {
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
        <label className="block text-sm font-medium text-cyan-100/90 mb-3">{label}</label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-500/10'
              : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-cyan-500/30 bg-slate-800/30 hover:border-cyan-400/50'
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
                <p className="text-sm font-medium text-emerald-300 mb-1">{file.name}</p>
                <p className="text-xs text-cyan-100/50">File uploaded successfully</p>
              </>
            ) : (
              <>
                <Icon className="w-12 h-12 text-cyan-400/60 mx-auto mb-3" />
                <p className="text-sm font-medium text-cyan-100/80 mb-1">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-cyan-100/50">{accept}</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Pages
  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
      if (email && password) {
        setLoading(true);
        setTimeout(() => {
          setPage('candidates');
          setLoading(false);
        }, 1000);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
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
              Demo Mode - Enter any credentials
            </motion.div>
          </div>

          <GlassCard glow>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-cyan-100/80 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-100/80 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              
              <Button
                onClick={handleLogin}
                variant="primary"
                loading={loading}
                className="w-full text-base py-4"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  };

  const Navigation = () => (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-slate-900/40 backdrop-blur-2xl border-b border-cyan-500/20 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-cyan-100">UNMASK</div>
              <div className="text-xs text-cyan-400/60">AI Intelligence</div>
            </div>
          </div>
          
          <button
            onClick={() => setPage('candidates')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              page === 'candidates'
                ? 'bg-cyan-500/20 text-cyan-200 shadow-lg shadow-cyan-500/20 border border-cyan-400/30'
                : 'text-cyan-100/60 hover:text-cyan-100 hover:bg-slate-800/50'
            }`}
          >
            Candidates
          </button>
        </div>
        
        <Button onClick={() => setPage('login')} variant="ghost" icon={LogOut}>
          Logout
        </Button>
      </div>
    </motion.div>
  );

  const CandidatesPage = () => (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-cyan-400" />
              <h1 className="text-4xl font-bold text-cyan-50">Candidates</h1>
            </div>
            <p className="text-cyan-100/60 text-lg">AI-powered candidate verification and analysis</p>
          </div>
          <Button onClick={() => setPage('newCandidate')} variant="primary" icon={Plus}>
            Add New Candidate
          </Button>
        </motion.div>

        <div className="space-y-4">
          {candidates.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard onClick={() => { setSelectedCandidate(c); setPage('detail'); }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <span className="text-white text-xl font-bold">{c.avatar}</span>
                      </div>
                      {c.score && (
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-cyan-50 mb-1">{c.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-cyan-100/60">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {c.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Github className="w-3.5 h-3.5" />
                          @{c.github}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {c.score ? (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-50 mb-1">{c.score}</div>
                        <div className="text-xs text-cyan-400/60">Credibility</div>
                      </div>
                    ) : (
                      <div className="text-center px-4">
                        <Clock className="w-6 h-6 text-cyan-400/40 mx-auto mb-1" />
                        <div className="text-xs text-cyan-100/50">Pending</div>
                      </div>
                    )}
                    
                    <Badge
                      variant={c.status === 'verified' ? 'success' : c.status === 'partial' ? 'warning' : 'default'}
                      icon={c.status === 'verified' ? CheckCircle2 : c.status === 'partial' ? AlertTriangle : Clock}
                    >
                      {c.status}
                    </Badge>
                    
                    <ChevronRight className="w-5 h-5 text-cyan-400/30" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const NewCandidatePage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      githubUsername: '',
    });
    const [cvFile, setCvFile] = useState(null);
    const [linkedinFile, setLinkedinFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = () => {
      if (step === 1 && formData.fullName && formData.email && formData.githubUsername) {
        setStep(2);
      } else if (step === 2 && cvFile) {
        setUploading(true);
        setTimeout(() => {
          const newCandidate = {
            id: Date.now().toString(),
            name: formData.fullName,
            email: formData.email,
            github: formData.githubUsername,
            score: null,
            status: 'unverified',
            avatar: formData.fullName.split(' ').map(n => n[0]).join(''),
          };
          setCandidates([...candidates, newCandidate]);
          setUploading(false);
          setPage('candidates');
        }, 2000);
      }
    };

    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button onClick={() => setPage('candidates')} variant="ghost" icon={ArrowLeft} className="mb-6">
              Back to Candidates
            </Button>
            
            <div className="flex items-center gap-3 mb-4">
              <Plus className="w-8 h-8 text-cyan-400" />
              <h1 className="text-4xl font-bold text-cyan-50">Add New Candidate</h1>
            </div>
            <p className="text-cyan-100/60 text-lg">Upload candidate information for AI analysis</p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-12">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${step >= 1 ? 'bg-cyan-500/20 border border-cyan-400/40' : 'bg-slate-800/30 border border-slate-700/30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                1
              </div>
              <span className={`font-medium ${step >= 1 ? 'text-cyan-100' : 'text-slate-400'}`}>Basic Info</span>
            </div>
            <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${step >= 2 ? 'bg-cyan-500/20 border border-cyan-400/40' : 'bg-slate-800/30 border border-slate-700/30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                2
              </div>
              <span className={`font-medium ${step >= 2 ? 'text-cyan-100' : 'text-slate-400'}`}>Upload Files</span>
            </div>
          </div>

          <GlassCard glow>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-cyan-50 mb-6">Candidate Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-cyan-100/90 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-100/90 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-100/90 mb-2">GitHub Username *</label>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60" />
                    <input
                      type="text"
                      value={formData.githubUsername}
                      onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                      placeholder="johndoe"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl text-cyan-50 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={!formData.fullName || !formData.email || !formData.githubUsername}
                  className="w-full mt-8"
                >
                  Continue to Upload Files
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-cyan-50 mb-6">Upload Documents</h3>

                <FileUpload
                  label="Resume / CV (Required) *"
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

                <div className="flex gap-4 mt-8">
                  <Button onClick={() => setStep(1)} variant="secondary" className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="primary"
                    loading={uploading}
                    disabled={!cvFile}
                    className="flex-1"
                  >
                    {uploading ? 'Creating & Analyzing...' : 'Create Candidate'}
                  </Button>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </div>
      </div>
    );
  };

  const DetailPage = () => (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard glow className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                    <span className="text-white text-4xl font-bold">{selectedCandidate?.avatar}</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-emerald-500 border-4 border-slate-900 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </motion.div>
                </div>
                
                <div>
                  <h1 className="text-4xl font-bold text-cyan-50 mb-3">{selectedCandidate?.name}</h1>
                  <div className="flex items-center gap-5 text-cyan-100/60 mb-4">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedCandidate?.email}
                    </span>
                    <span className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      @{selectedCandidate?.github}
                    </span>
                  </div>
                  <Badge
                    variant={selectedCandidate?.status === 'verified' ? 'success' : 'warning'}
                    icon={CheckCircle2}
                  >
                    {selectedCandidate?.status}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={() => setPage('analysis')} variant="primary" icon={Brain}>
                  View AI Analysis
                </Button>
                <Button onClick={() => setPage('calls')} variant="secondary" icon={Phone}>
                  Reference Calls
                </Button>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Credibility Score', value: selectedCandidate?.score || 'N/A', icon: TrendingUp },
              { label: 'Projects Verified', value: '8', icon: CheckCircle2 },
              { label: 'Reference Calls', value: '2', icon: Phone }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <GlassCard>
                  <div className="text-center">
                    <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                    <div className="text-4xl font-bold text-cyan-50 mb-2">{stat.value}</div>
                    <div className="text-sm text-cyan-100/60">{stat.label}</div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const AnalysisPage = () => (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-8">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard glow>
            <div className="flex items-center gap-12">
              <ScoreRing score={analysis.score} />
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-7 h-7 text-emerald-400" />
                  <h2 className="text-3xl font-bold text-cyan-50">Highly Credible</h2>
                </div>
                <p className="text-cyan-100/70 text-lg mb-6">{analysis.recommendation}</p>
                <div className="flex gap-3">
                  <Badge variant="success" icon={CheckCircle2}>Highly Credible</Badge>
                  <Badge variant="danger" icon={Flag}>1 Red Flag</Badge>
                  <Badge variant="warning" icon={AlertTriangle}>2 Yellow Flags</Badge>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-8">
              <Target className="w-6 h-6 text-cyan-400" />
              <h3 className="text-2xl font-bold text-cyan-50">Project Verification</h3>
            </div>
            
            <div className="space-y-4">
              {analysis.projects.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-6 bg-slate-800/30 border border-cyan-500/20 rounded-2xl hover:bg-slate-800/50 hover:border-cyan-400/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-cyan-50 text-lg mb-2">{p.name}</h4>
                      <a href={`https://${p.repo}`} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-3">
                        <Github className="w-4 h-4" />
                        {p.repo}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-sm text-cyan-100/60">{p.evidence}</p>
                    </div>
                    <Badge variant={p.status === 'verified' ? 'success' : 'warning'}>
                      {p.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-cyan-100/60">
                      <span>Confidence Level</span>
                      <span className="font-semibold text-cyan-50">{p.confidence}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.confidence}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className={`h-full rounded-full ${
                          p.confidence >= 80
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : p.confidence >= 60
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Flags */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <Flag className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-bold text-cyan-50">Red Flags</h3>
              </div>
              {analysis.redFlags.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-cyan-50/90">{f}</p>
                </div>
              ))}
            </GlassCard>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-bold text-cyan-50">Yellow Flags</h3>
              </div>
              <div className="space-y-3">
                {analysis.yellowFlags.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-cyan-50/90">{f}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-8">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              <h3 className="text-2xl font-bold text-cyan-50">AI-Generated Interview Questions</h3>
            </div>
            
            <div className="space-y-4">
              {analysis.questions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="flex items-start gap-5 p-5 bg-slate-800/30 border border-cyan-500/20 rounded-2xl hover:bg-slate-800/50 hover:border-cyan-400/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <p className="text-cyan-50/90 flex-1 pt-1.5">{q}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );

  const CallsPage = () => {
    const [selectedCall, setSelectedCall] = useState(null);

    const summary = `Reference check completed with ${selectedCall?.name}, ${selectedCall?.company}.

**Key Points:**
• Confirmed employment: January 2021 - March 2023 (2.5 years)
• Position: Senior Full Stack Developer
• Technical Skills: Strong in React, Node.js; consistently high code quality
• Major Achievement: Led mobile banking app serving 500,000+ users
• Area for Growth: Communication in standups (improved over time)
• Strong Recommendation: Would hire again without hesitation

**Overall Assessment:** Highly positive reference. All claims verified. Candidate demonstrated strong technical skills, leadership capability, and professional growth. Reference enthusiastically recommends for senior engineering roles.`;

    if (selectedCall) {
      return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl"
          >
            <GlassCard glow>
              <div className="p-8 border-b border-cyan-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-3xl font-bold text-cyan-50">Reference Call Summary</h2>
                  </div>
                  <p className="text-cyan-100/60">{selectedCall.name} • {selectedCall.company}</p>
                </div>
                <Button onClick={() => setSelectedCall(null)} variant="ghost">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-cyan-50">AI-Generated Summary</h3>
                      <p className="text-sm text-cyan-400/60">Powered by advanced language models</p>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-3xl backdrop-blur-sm">
                    <div className="prose prose-sm max-w-none text-cyan-50/90 whitespace-pre-line leading-relaxed">
                      {summary}
                    </div>
                  </div>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-8 h-8 text-cyan-400" />
              <h1 className="text-4xl font-bold text-cyan-50">Reference Calls</h1>
            </div>
            <p className="text-cyan-100/60 text-lg">AI-powered reference verification summaries</p>
          </motion.div>

          <div className="space-y-4">
            {calls.map((c, index) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard onClick={() => setSelectedCall(c)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-semibold text-cyan-50 mb-1">{c.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-cyan-100/60">
                          <span className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5" />
                            {c.company}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {c.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant="success" icon={CheckCircle2}>{c.status}</Badge>
                      <ChevronRight className="w-5 h-5 text-cyan-400/30" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Router
  if (page === 'login') return <LoginPage />;
  if (page === 'candidates') return <CandidatesPage />;
  if (page === 'newCandidate') return <NewCandidatePage />;
  if (page === 'detail') return <DetailPage />;
  if (page === 'analysis') return <AnalysisPage />;
  if (page === 'calls') return <CallsPage />;

  return null;
}
