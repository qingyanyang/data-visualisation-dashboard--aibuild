"use client";

import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Monitor your procurement, sales, and inventory performance"
      />

      <main className="flex-1 overflow-y-auto p-6">line chart</main>
    </>
  );
}
