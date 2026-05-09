import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  AUTH_CHANGE_EVENT,
  clearSession,
  getUser,
  isAuthenticated,
  needsProfileCompletion,
} from "./lib/auth";
import { setUnauthorizedHandler } from "./lib/http";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
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

function CompleteProfileGuard({ children, authed }) {
  if (!authed) return <Navigate to="/login" replace />;
  const user = getUser();
  if (needsProfileCompletion(user)) return <Navigate to="/complete-profile" replace />;
  return children;
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setAuthed(false);
    });
    const onChange = () => setAuthed(isAuthenticated());
    window.addEventListener("storage", onChange);
    window.addEventListener(AUTH_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    };
  }, []);

  const loginSuccess = useMemo(() => () => setAuthed(true), []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          authed ? (
            <Navigate
              to={needsProfileCompletion(getUser()) ? "/complete-profile" : "/candidates"}
              replace
            />
          ) : (
            <LoginPage onSuccess={loginSuccess} />
          )
        }
      />
      <Route
        path="/complete-profile"
        element={
          authed ? (
            needsProfileCompletion(getUser()) ? (
              <CompleteProfilePage />
            ) : (
              <Navigate to="/candidates" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/candidates"
        element={
          <CompleteProfileGuard authed={authed}>
            <CandidatesPage />
          </CompleteProfileGuard>
        }
      />
      <Route
        path="/candidates/new"
        element={
          <CompleteProfileGuard authed={authed}>
            <NewCandidatePage />
          </CompleteProfileGuard>
        }
      />
      <Route
        path="/candidates/:candidateId"
        element={
          <CompleteProfileGuard authed={authed}>
            <CandidateDetailPage />
          </CompleteProfileGuard>
        }
      />
      <Route
        path="/candidates/:candidateId/analysis"
        element={
          <CompleteProfileGuard authed={authed}>
            <AnalysisPage />
          </CompleteProfileGuard>
        }
      />
      <Route
        path="/candidates/:candidateId/reference-calls"
        element={
          <CompleteProfileGuard authed={authed}>
            <ReferenceCallsPage />
          </CompleteProfileGuard>
        }
      />
      <Route path="*" element={<Navigate to={authed ? "/candidates" : "/"} replace />} />
    </Routes>
  );
}
