"use client";

import {
  DailyData,
  ProductComparisonChart,
} from "@/components/charts/product-comparison-chart";
import { DashboardHeader } from "@/components/dashboard-header";
import Spinner from "@/components/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const enokiMushroomData: DailyData[] = [
  {
    date: "Day 1",
    procurementQty: 750,
    procurementUnitPrice: 3.2,
    salesQty: 157,
    salesUnitPrice: 4.38,
    endInventoryQty: 1020 + 750 - 157,
  },
  {
    date: "Day 2",
    procurementQty: 240,
    procurementUnitPrice: 2.8,
    salesQty: 111,
    salesUnitPrice: 4.38,
    endInventoryQty: 1020 + 750 - 157 + 240 - 111,
  },
  {
    date: "Day 3",
    procurementQty: 192,
    procurementUnitPrice: 3.6,
    salesQty: 95,
    salesUnitPrice: 4.38,
    endInventoryQty: 1020 + 750 - 157 + 240 - 111 + 192 - 95,
  },
];

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

      <main className="flex-1 overflow-y-auto p-6">
        {/* Calendar to select at most 30 days*/}
        {/* Search bar for products */}
        {/* Matrix Selection */}
        <ProductComparisonChart
          data={enokiMushroomData}
          productName={"Mushroom"}
        />
      </main>
    </>
  );
}
