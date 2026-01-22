export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  status?: "ACTIVE" | "INACTIVE";
};

const KEY = "auth_state_v1";

export function getAuthFromStorage(): { token: string; user: AuthUser } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthToStorage(token: string, user: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
}

export function clearAuthStorage() {
  localStorage.removeItem(KEY);
}
