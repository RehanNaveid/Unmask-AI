import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../api/client';

const CandidateAnalysis = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analysisData, candidateData] = await Promise.all([
        apiGet(`/candidates/${id}/analysis`),
        apiGet(`/candidates/${id}`),
      ]);
      setAnalysis(analysisData);
      setCandidate(candidateData);
    } catch (err) {
      setError(err.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const getLabelColor = (label) => {
    switch (label) {
      case 'suspicious':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'trusted':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case 'human_review':
        return 'Requires human review';
      case 'trusted':
        return 'Trusted candidate';
      case 'reject':
        return 'Recommend rejection';
      default:
        return recommendation;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'unverified':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'unverifiable':
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

  if (error || !analysis) {
    return (
      <div className="glass-card p-6 bg-rose-500/20 border-rose-500/50">
        <p className="text-rose-300">{error || 'Analysis not found'}</p>
        <Link to={`/candidates/${id}`} className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">
          ← Back to candidate
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
        <span>›</span>
        <Link to={`/candidates/${id}`} className="hover:text-white">{candidate?.name || 'Candidate'}</Link>
        <span>›</span>
        <span className="text-white">Analysis</span>
      </div>

      {/* Hero Section */}
      <div className="glass-card p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-4">Credibility Analysis</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-2 text-lg font-semibold rounded-full border ${getLabelColor(analysis.label)}`}>
                Verdict: {analysis.label.toUpperCase()}
              </span>
            </div>
            <span className={`px-4 py-2 text-sm font-medium rounded-full border bg-indigo-500/20 text-indigo-300 border-indigo-500/50`}>
              {getRecommendationText(analysis.recommendation)}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.score / 100)}`}
                  className="text-indigo-500 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{analysis.score.toFixed(0)}</div>
                  <div className="text-xs text-slate-400">Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flags & Yellow Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-rose-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Red Flags</h2>
          </div>
          {analysis.redFlags && analysis.redFlags.length > 0 ? (
            <ul className="space-y-2">
              {analysis.redFlags.map((flag, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-300">
                  <span className="text-rose-400 mt-1">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic">No red flags detected</p>
          )}
        </div>

        <div className="glass-card p-6 border-amber-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Yellow Flags</h2>
          </div>
          {analysis.yellowFlags && analysis.yellowFlags.length > 0 ? (
            <ul className="space-y-2">
              {analysis.yellowFlags.map((flag, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-300">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic">No yellow flags detected</p>
          )}
        </div>
      </div>

      {/* Explanation */}
      {analysis.explanation && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Reasoning Summary</h2>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{analysis.explanation}</p>
        </div>
      )}

      {/* Language Alignment */}
      {analysis.languageAlignment && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Language Analysis Notes</h3>
            {analysis.languageAlignment.notes && analysis.languageAlignment.notes.length > 0 ? (
              <ul className="space-y-2">
                {analysis.languageAlignment.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <span className="text-indigo-400 mt-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic">No language notes available</p>
            )}
          </div>
          <div className="space-y-4">
            <div className="glass-card p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3">CV Languages on GitHub</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.languageAlignment.cv_languages_supported && analysis.languageAlignment.cv_languages_supported.length > 0 ? (
                  analysis.languageAlignment.cv_languages_supported.map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/50 rounded-full text-sm">
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-sm">None found</span>
                )}
              </div>
            </div>
            <div className="glass-card p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3">Missing on GitHub</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.languageAlignment.cv_languages_missing_on_github && analysis.languageAlignment.cv_languages_missing_on_github.length > 0 ? (
                  analysis.languageAlignment.cv_languages_missing_on_github.map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded-full text-sm">
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-sm">None missing</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Verification */}
      {analysis.projectVerification && analysis.projectVerification.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Project Verification</h2>
          <div className="space-y-4">
            {analysis.projectVerification.map((project, index) => (
              <div key={index} className="glass-card p-6 bg-slate-800/30">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{project.project_name}</h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {project.matched_repo ? (
                    <div>
                      <span className="text-sm text-slate-400">Matched Repository: </span>
                      <a
                        href={`https://github.com/${candidate?.githubUsername}/${project.matched_repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {project.matched_repo}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-rose-400">No matching repository found</p>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">Confidence</span>
                      <span className="text-sm font-medium text-slate-300">{project.confidence}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.confidence}%` }}
                      />
                    </div>
                  </div>

                  {project.evidence && project.evidence.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-2">Evidence:</p>
                      <ul className="space-y-1">
                        {project.evidence.map((evidence, evIndex) => (
                          <li key={evIndex} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-indigo-400 mt-1">•</span>
                            <span>{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Follow-up Questions for Interview</h2>
          <ol className="space-y-3 list-decimal list-inside">
            {analysis.suggestedQuestions.map((question, index) => (
              <li key={index} className="text-slate-300 pl-2">{question}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Consolidated Reasons */}
      {analysis.consolidatedReasons && analysis.consolidatedReasons.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Key Reasons for Verdict</h2>
          <ul className="space-y-2">
            {analysis.consolidatedReasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-slate-300">
                <span className="text-indigo-400 mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Repos */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Top Repositories</h2>
        {analysis.topRepos && analysis.topRepos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.topRepos.map((repo, index) => (
              <div key={index} className="glass-card p-4 bg-slate-800/30">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold mb-2 block"
                >
                  {repo.name}
                </a>
                {repo.language && (
                  <span className="inline-block px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 rounded text-xs mb-2">
                    {repo.language}
                  </span>
                )}
                {repo.description && (
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{repo.description}</p>
                )}
                {repo.pushed_at && (
                  <p className="text-xs text-slate-500 mt-2">
                    Last pushed: {new Date(repo.pushed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 bg-amber-500/10 border-amber-500/30">
            <p className="text-amber-300">
              No strong GitHub repositories surfaced. This increases the weight of missing evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateAnalysis;

