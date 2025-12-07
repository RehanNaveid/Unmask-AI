import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewCandidate from './pages/NewCandidate';
import CandidateDetail from './pages/CandidateDetail';
import CandidateAnalysis from './pages/CandidateAnalysis';

const AppRoutes = () => {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/candidates/new"
        element={
          <RequireAuth>
            <AppLayout>
              <NewCandidate />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/candidates/:id"
        element={
          <RequireAuth>
            <AppLayout>
              <CandidateDetail />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/candidates/:id/analysis"
        element={
          <RequireAuth>
            <AppLayout>
              <CandidateAnalysis />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

