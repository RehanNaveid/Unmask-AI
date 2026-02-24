import env from "../config/env";
import { request } from "../lib/http";

export function analyzeCandidate(payload) {
  return request(env.llmBaseUrl, "/api/analyze", {
    method: "POST",
    body: payload,
    timeoutMs: 120000,
  });
}
