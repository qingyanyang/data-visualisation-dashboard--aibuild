"use client";

import { useQuery } from "@tanstack/react-query";

interface UploadHistory {
  id: number;
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  status: string;
  errors?: any;
  user: {
    email: string;
  };
}

interface UploadHistoryResponse {
  data: UploadHistory[];
  page: number;
  total: number;
  totalPages: number;
}

async function fetchUploadHistory(
  page: number
): Promise<UploadHistoryResponse> {
  const res = await fetch(`/api/upload?page=${page}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Fetch upload history failed.");
  }
  return res.json();
}

export function useUploadHistory(page: number) {
  return useQuery({
    queryKey: ["uploadHistory", page],
    queryFn: () => fetchUploadHistory(page),
    staleTime: 30 * 1000,
  });
}
