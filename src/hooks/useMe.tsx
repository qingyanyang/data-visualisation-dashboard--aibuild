"use client";
import { useQuery } from "@tanstack/react-query";

async function fetchMe() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Unauthorized");
  }
  return res.json();
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
  });
}
