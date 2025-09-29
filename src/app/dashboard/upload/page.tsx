"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { ExcelUpload } from "@/components/excel-upload";
import { UploadsHistory } from "@/components/uploads-history";

export default function UploadPage() {
  return (
    <>
      <DashboardHeader
        title="Data Upload"
        description="Upload and process your Excel files"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <ExcelUpload />

          {/* Uploads History Table */}
          <UploadsHistory />
        </div>
      </main>
    </>
  );
}
