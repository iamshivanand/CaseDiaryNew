"use client";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("advocase_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include", // Ensure advocase_token cookie is always transmitted
  });
}
