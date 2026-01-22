import { getAuthFromStorage, clearAuthStorage } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const auth = getAuthFromStorage();
  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // if token is invalid/inactive user, force logout
  if (res.status === 401) {
    clearAuthStorage();
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message || "Request failed";
    throw new Error(msg);
  }

  return data;
}
