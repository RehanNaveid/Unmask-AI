import env from "../config/env";
import { request } from "../lib/http";

export function login(payload) {
  return request(env.backendBaseUrl, "/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function register(payload) {
  return request(env.backendBaseUrl, "/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function listCandidates() {
  return request(env.backendBaseUrl, "/api/candidates", {
    auth: true,
  });
}

export function getCandidate(candidateId) {
  return request(env.backendBaseUrl, `/api/candidates/${candidateId}`, {
    auth: true,
  });
}

export function createCandidate({ name, email, githubUsername, cvFile, linkedinFile }) {
  const form = new FormData();
  form.append("name", name);
  form.append("email", email);
  form.append("github_username", githubUsername);
  form.append("cv", cvFile);
  if (linkedinFile) {
    form.append("linkedin", linkedinFile);
  }

  return request(env.backendBaseUrl, "/api/candidates", {
    method: "POST",
    body: form,
    isMultipart: true,
    auth: true,
    timeoutMs: 90000,
  });
}

export function getCandidateAnalysis(candidateId) {
  return request(env.backendBaseUrl, `/api/candidates/${candidateId}/analysis`, {
    auth: true,
  });
}

export function getParsedCv(candidateId) {
  return request(env.backendBaseUrl, `/api/parsed/${candidateId}/cv`, {
    auth: true,
  });
}

export function getParsedLinkedin(candidateId) {
  return request(env.backendBaseUrl, `/api/parsed/${candidateId}/linkedin`, {
    auth: true,
  });
}

export function getParsedGithub(candidateId) {
  return request(env.backendBaseUrl, `/api/parsed/${candidateId}/github`, {
    auth: true,
  });
}

export function deleteCandidate(candidateId) {
  return request(env.backendBaseUrl, `/api/candidates/${candidateId}`, {
    method: "DELETE",
    auth: true,
  });
}
