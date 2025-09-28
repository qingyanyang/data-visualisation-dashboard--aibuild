"use client";

import { useMutation } from "@tanstack/react-query";

async function register({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Registration failed");
  }
  return res.json();
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}
