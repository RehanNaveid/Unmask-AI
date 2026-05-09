const env = {
  backendBaseUrl: import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8080",
  llmBaseUrl: import.meta.env.VITE_LLM_BASE_URL || "http://localhost:8001",
  referenceBaseUrl: import.meta.env.VITE_REFERENCE_BASE_URL || "http://localhost:8002",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
};
console.log(import.meta.env);
console.log(env);
export default env;
