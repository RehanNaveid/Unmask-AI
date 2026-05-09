const TOKEN_KEY = "unmask_auth_token";
const USER_KEY = "unmask_auth_user";

export const AUTH_CHANGE_EVENT = "unmask_auth_change";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user || {}));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/**
 * Backwards compatible helper for auth responses.
 * Expected backend payload shape (email/password or Google):
 * { token, email, fullName, roles, provider, onboardingCompleted, company, position }
 */
export function setAuthSession(data) {
  if (!data) return;
  setSession(data.token, {
    email: data.email,
    fullName: data.fullName,
    roles: data.roles,
    provider: data.provider,
    onboardingCompleted: data.onboardingCompleted,
    company: data.company,
    position: data.position,
  });
}

export function needsProfileCompletion(user) {
  return Boolean(user?.provider === "GOOGLE" && user?.onboardingCompleted === false);
}
