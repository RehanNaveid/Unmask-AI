import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGet, apiDelete } from '../api/client';

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`/candidates/${id}`);
      setCandidate(data);
    } catch (err) {
      setError(err.message || 'Failed to load candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) {
      return;
    }

    try {
      await apiDelete(`/candidates/${id}`);
      navigate('/dashboard');
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

  if (error || !candidate) {
    return (
      <div className="glass-card p-6 bg-rose-500/20 border-rose-500/50">
        <p className="text-rose-300">{error || 'Candidate not found'}</p>
      </div>
    );
  }

  const facts = candidate.facts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{candidate.name}</h1>
            <div className="space-y-1 text-slate-300">
              <p className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {candidate.email}
              </p>
              {candidate.githubUsername && (
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <a href={`https://github.com/${candidate.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                    {candidate.githubUsername}
                  </a>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(candidate.status)}`}>
              {candidate.status}
            </span>
            <Link to={`/candidates/${id}/analysis`} className="btn-primary text-center">
              View Analysis
            </Link>
            <button onClick={handleDelete} className="btn-danger">
              Delete Candidate
            </button>
          </div>
        </div>
      </div>

      {/* Source Files */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Source Files</h2>
        <div className="space-y-2 text-slate-300">
          <p className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CV: {candidate.cvPath || 'N/A'}
          </p>
          {candidate.linkedinPath && (
            <p className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              LinkedIn: {candidate.linkedinPath}
            </p>
          )}
        </div>
      </div>

      {/* Facts Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FactCard
          title="Repositories"
          value={facts.repo_count || 'N/A'}
          icon="📁"
        />
        <FactCard
          title="Languages"
          value={facts.languages ? facts.languages.join(', ') : 'N/A'}
          icon="💻"
        />
        <FactCard
          title="Last Pushed"
          value={facts.last_pushed ? new Date(facts.last_pushed).toLocaleDateString() : 'N/A'}
          icon="📅"
        />
      </div>

      {/* Council Summary */}
      {candidate.councilSummary && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Council Summary</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{candidate.councilSummary}</p>
        </div>
      )}
    </div>
  );
};

const FactCard = ({ title, value, icon }) => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-400">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
};

export default CandidateDetail;

