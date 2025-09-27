"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { ExcelUpload } from "@/components/excel-upload";

export default function ImportPage() {
  return (
    <>
      <DashboardHeader
        title="Data Import"
        description="Upload and process your Excel files"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <ExcelUpload />

          {/* Uploads History table*/}
        </div>
      </main>
    </>
  );
}
