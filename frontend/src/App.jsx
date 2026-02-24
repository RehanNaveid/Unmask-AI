import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { clearSession, isAuthenticated } from "./lib/auth";
import { setUnauthorizedHandler } from "./lib/http";
import LoginPage from "./pages/LoginPage";
import CandidatesPage from "./pages/CandidatesPage";
import NewCandidatePage from "./pages/NewCandidatePage";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import AnalysisPage from "./pages/AnalysisPage";
import ReferenceCallsPage from "./pages/ReferenceCallsPage";

function Guard({ children, authed }) {
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setAuthed(false);
    });
    const onStorage = () => setAuthed(isAuthenticated());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const loginSuccess = useMemo(() => () => setAuthed(true), []);

  return (
    <Routes>
      <Route
        path="/login"
        element={authed ? <Navigate to="/candidates" replace /> : <LoginPage onSuccess={loginSuccess} />}
      />
      <Route
        path="/candidates"
        element={
          <Guard authed={authed}>
            <CandidatesPage />
          </Guard>
        }
      />
      <Route
        path="/candidates/new"
        element={
          <Guard authed={authed}>
            <NewCandidatePage />
          </Guard>
        }
      />
      <Route
        path="/candidates/:candidateId"
        element={
          <Guard authed={authed}>
            <CandidateDetailPage />
          </Guard>
        }
      />
      <Route
        path="/candidates/:candidateId/analysis"
        element={
          <Guard authed={authed}>
            <AnalysisPage />
          </Guard>
        }
      />
      <Route
        path="/candidates/:candidateId/reference-calls"
        element={
          <Guard authed={authed}>
            <ReferenceCallsPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to={authed ? "/candidates" : "/login"} replace />} />
    </Routes>
  );
}
