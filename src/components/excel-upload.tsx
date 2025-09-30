"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useExcelUpload } from "@/hooks/useExcelUpload";
import SectionLayout from "./section-layout";
import { useQueryClient } from "@tanstack/react-query";

interface UploadStatus {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  message: string;
  recordsProcessed?: number;
}

export function ExcelUpload() {
  const queryClient = useQueryClient();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
    progress: 0,
    message: "",
  });

  const { mutateAsync: uploadExcel, isPending } = useExcelUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        setUploadStatus({
          status: "error",
          progress: 0,
          message: "Please upload a valid Excel file (.xlsx or .xls)",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({
          status: "error",
          progress: 0,
          message: "File size must be less than 10MB",
        });
        return;
      }

      try {
        setUploadStatus({
          status: "uploading",
          progress: 10,
          message: "Uploading file...",
        });

        const result = await uploadExcel(file);
        if (result.success) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["uploadHistory"] }),
            queryClient.invalidateQueries({ queryKey: ["chartData"] }),
          ]);
          setUploadStatus({
            status: "success",
            progress: 100,
            message: result.message,
            recordsProcessed: result.recordsProcessed,
          });
        } else {
          throw new Error(result.error || "Processing failed");
        }
      } catch (error) {
        setUploadStatus({
          status: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "An error occurred",
        });
      }
    },
    [uploadExcel]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled:
      isPending ||
      uploadStatus.status === "uploading" ||
      uploadStatus.status === "processing",
  });

  const resetUpload = () => {
    setUploadStatus({
      status: "idle",
      progress: 0,
      message: "",
    });
  };

  return (
    <SectionLayout
      title={"Excel Data Upload"}
      desc={` Upload your Excel file containing procurement, sales, and inventory
          data. The file should include columns for Product Name, dates,
          quantities, and prices.`}
    >
      {uploadStatus.status === "idle" && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg">Drop the Excel file here...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">
                Drag & drop an Excel file here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports .xlsx and .xls files up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {(uploadStatus.status === "uploading" ||
        uploadStatus.status === "processing" ||
        isPending) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">{uploadStatus.message}</span>
          </div>
          <Progress value={uploadStatus.progress} className="w-full" />
        </div>
      )}

      {uploadStatus.status === "success" && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success/50">
            {uploadStatus.message}
            {uploadStatus.recordsProcessed && (
              <span className="block mt-1">
                Records processed: {uploadStatus.recordsProcessed}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus.status === "error" && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <XCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive/50">
            {uploadStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {(uploadStatus.status === "success" ||
        uploadStatus.status === "error") && (
        <Button
          onClick={resetUpload}
          variant="outline"
          className="w-full bg-transparent"
        >
          Upload Another File
        </Button>
      )}

      {/* Expected Format Info */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Expected Excel Format
        </h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Your Excel file should contain the following columns:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Product Name</li>
            <li>Opening Inventory (number)</li>
            <li>Procurement Qty (number)</li>
            <li>Procurement Price (eg: $3.50)</li>
            <li>Sales Qty (number)</li>
            <li>Sales Price (eg: $3.50)</li>
            <li>Date (eg: 2025-09-26)</li>
          </ul>
        </div>
      </div>
    </SectionLayout>
  );
}
