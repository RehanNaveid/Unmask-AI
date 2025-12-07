import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiDelete } from '../api/client';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    suspicious: 0,
    trusted: 0,
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Assuming GET /api/candidates exists (you may need to adjust this endpoint)
      // If endpoint doesn't exist, catch will handle it gracefully
      const data = await apiGet('/candidates');
      const candidatesList = Array.isArray(data) ? data : (data?.content || []);
      setCandidates(candidatesList);
      
      // Calculate stats
      const total = candidatesList.length;
      const completed = candidatesList.filter(c => c.status === 'COMPLETED').length;
      const suspicious = candidatesList.filter(c => c.label === 'suspicious').length;
      const trusted = candidatesList.filter(c => c.label === 'trusted').length;
      
      setStats({ total, completed, suspicious, trusted });
    } catch (err) {
      // If endpoint doesn't exist yet (404), show empty state instead of error
      if (err.status === 404) {
        setCandidates([]);
        setStats({ total: 0, completed: 0, suspicious: 0, trusted: 0 });
      } else {
        setError(err.message || 'Failed to load candidates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) {
      return;
    }

    try {
      await apiDelete(`/candidates/${id}`);
      setCandidates(candidates.filter(c => c.id !== id));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete candidate');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'PROCESSING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Overview of your candidate analyses</p>
      </div>

      {error && (
        <div className="glass-card p-4 bg-rose-500/20 border-rose-500/50">
          <p className="text-rose-300">{error}</p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Candidates" value={stats.total} icon="👥" />
        <StatCard title="Completed" value={stats.completed} icon="✅" />
        <StatCard title="Suspicious" value={stats.suspicious} icon="⚠️" color="rose" />
        <StatCard title="Trusted" value={stats.trusted} icon="✓" color="green" />
      </div>

      {/* Candidates table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Candidates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">GitHub</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No candidates yet. <Link to="/candidates/new" className="text-indigo-400 hover:text-indigo-300">Create your first candidate</Link>
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{candidate.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{candidate.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {candidate.githubUsername ? (
                        <a href={`https://github.com/${candidate.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          {candidate.githubUsername}
                        </a>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link to={`/candidates/${candidate.id}`} className="text-indigo-400 hover:text-indigo-300">
                        View
                      </Link>
                      <Link to={`/candidates/${candidate.id}/analysis`} className="text-purple-400 hover:text-purple-300">
                        Analysis
                      </Link>
                      <button onClick={() => handleDelete(candidate.id)} className="text-rose-400 hover:text-rose-300">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30',
    rose: 'from-rose-500/20 to-rose-600/20 border-rose-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  };

  return (
    <div className={`glass-card p-6 bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
};

export default Dashboard;

