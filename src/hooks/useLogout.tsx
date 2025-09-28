"use client";

import { useMutation } from "@tanstack/react-query";

async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Logout failed");
  }
  return res.json();
}

export function useLogout() {
  return useMutation({
    mutationFn: logout,
  });
}
