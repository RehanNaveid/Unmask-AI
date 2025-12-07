import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPostMultipart } from '../api/client';

const NewCandidate = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    github_username: '',
  });
  const [cvFile, setCvFile] = useState(null);
  const [linkedinFile, setLinkedinFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'cv') {
      setCvFile(file);
    } else {
      setLinkedinFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!cvFile) {
      setError('CV file is required');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('github_username', formData.github_username);
      formDataToSend.append('cv', cvFile);
      if (linkedinFile) {
        formDataToSend.append('linkedin', linkedinFile);
      }

      const response = await apiPostMultipart('/candidates', formDataToSend);
      setSuccess(`Candidate created successfully! Redirecting...`);
      
      setTimeout(() => {
        navigate(`/candidates/${response.id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">New Candidate</h1>
        <p className="text-slate-400">Upload candidate information and documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main form */}
        <div className="lg:col-span-3">
          <div className="glass-card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg p-4 text-rose-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-300 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label htmlFor="github_username" className="block text-sm font-medium text-slate-300 mb-2">
                  GitHub Username *
                </label>
                <input
                  id="github_username"
                  name="github_username"
                  type="text"
                  value={formData.github_username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label htmlFor="cv" className="block text-sm font-medium text-slate-300 mb-2">
                  CV/Resume * (PDF)
                </label>
                <input
                  id="cv"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'cv')}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
                {cvFile && (
                  <p className="mt-2 text-sm text-slate-400">Selected: {cvFile.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-slate-300 mb-2">
                  LinkedIn Profile (Optional) (PDF)
                </label>
                <input
                  id="linkedin"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'linkedin')}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
                {linkedinFile && (
                  <p className="mt-2 text-sm text-slate-400">Selected: {linkedinFile.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Candidate...' : 'Create Candidate'}
              </button>
            </form>
          </div>
        </div>

        {/* Pipeline sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pipeline</h3>
            <div className="space-y-4">
              <PipelineStep number="1" title="Upload" active={true} />
              <PipelineStep number="2" title="Process" active={false} />
              <PipelineStep number="3" title="Analyze" active={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PipelineStep = ({ number, title, active }) => {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
        active ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
      }`}>
        {number}
      </div>
      <div className="flex-1 pt-1">
        <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
          {title}
        </p>
      </div>
    </div>
  );
};

export default NewCandidate;

