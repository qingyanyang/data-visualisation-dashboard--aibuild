"use client";

import { useMutation } from "@tanstack/react-query";

async function login({ email, password }: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }
  return res.json();
}

export function useLogin() {
  return useMutation({ mutationFn: login });
}
