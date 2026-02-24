import env from "../config/env";
import { request } from "../lib/http";

export function startReferenceCall(payload) {
  return request(env.referenceBaseUrl, "/api/reference-call", {
    method: "POST",
    body: payload,
    timeoutMs: 45000,
  });
}

export function fetchTranscript(referenceCallId) {
  return request(env.referenceBaseUrl, `/api/reference-call/${referenceCallId}/fetch-transcript`, {
    method: "POST",
    timeoutMs: 45000,
  });
}

export function generateSummary(referenceCallId) {
  return request(env.referenceBaseUrl, `/api/reference-call/${referenceCallId}/generate-summary`, {
    method: "POST",
    timeoutMs: 60000,
  });
}
