"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import Spinner from "@/components/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data, isError, isLoading } = useMe();
  const { setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isError) {
      setUser(null);
      router.push("/login");
    }
  }, [isError]);

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  if (isLoading) return <Spinner />;

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
