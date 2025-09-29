"use client";

import { useMutation } from "@tanstack/react-query";

interface UploadResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  error?: string;
}

async function uploadExcelApi(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!res.ok) {
    return { success: false, message: "Upload failed", error: json.error };
  }

  return {
    success: true,
    message: json.message || "Upload successful",
    recordsProcessed: json.recordsProcessed,
  };
}

export function useExcelUpload() {
  return useMutation({
    mutationFn: (file: File) => uploadExcelApi(file),
  });
}
