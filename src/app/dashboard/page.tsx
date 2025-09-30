"use client";

import {
  DailyData,
  ProductComparisonChart,
} from "@/components/charts/product-comparison-chart";
import { DashboardHeader } from "@/components/dashboard-header";
import Spinner from "@/components/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useChartData } from "@/hooks/useChartData";
import { useMe } from "@/hooks/useMe";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { SearchableMultiSelect } from "@/components/searchable-multi-select";
import { MatrixSelect } from "@/components/matrix-select";
import SectionLayout from "@/components/section-layout";

export type MetricType = "procurement" | "sales" | "endInventory";

const METRIC_OPTIONS: { value: MetricType; label: string }[] = [
  { value: "procurement", label: "Procurement" },
  { value: "sales", label: "Sales" },
  { value: "endInventory", label: "End Inventory" },
];

export default function DashboardPage() {
  const { data, isError, isLoading } = useMe();
  const { setUser } = useAuth();
  const router = useRouter();

  // --- Local filters ---
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const today = new Date();
    return { from: today, to: today };
  });

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([
    "procurement",
    "sales",
    "endInventory",
  ]);

  const handleDateRangeChange = (
    range: { from?: Date; to?: Date } | undefined
  ) => {
    if (!range?.from && !range?.to) return;

    if (range?.from && !range?.to) {
      // only from selected → use same for to
      setDateRange({ from: range.from, to: range.from });
    } else if (!range?.from && range?.to) {
      // only to selected → use same for from
      setDateRange({ from: range.to, to: range.to });
    } else if (range?.from && range?.to) {
      // both defined
      setDateRange({ from: range.from, to: range.to });
    }
  };

  // --- Chart Data ---
  const {
    data: chartData,
    isLoading: isChartLoading,
    error,
  } = useChartData({
    productIds: selectedProducts,
    from: dateRange.from?.toISOString().slice(0, 10) ?? "",
    to: dateRange.to?.toISOString().slice(0, 10) ?? "",
    metrics: selectedMetrics,
  });

  // --- Auth Handling ---
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

  useEffect(() => {
    if (selectedProducts.length > 1) {
      // multiple products → force to single metric "procurement"
      setSelectedMetrics(["procurement"]);
    } else {
      // single or no product → allow all metrics
      setSelectedMetrics(["procurement", "sales", "endInventory"]);
    }
  }, [selectedProducts]);

  if (isLoading) return <Spinner />;

  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Monitor your procurement, sales, and inventory performance"
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <SectionLayout
          title={"Data History"}
          desc={`View a record of all uploaded Excel files, including who uploaded
                  them, when, how many rows were processed, and their final status.`}
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              maxDays={30}
            />

            <SearchableMultiSelect
              label="Products"
              value={selectedProducts}
              onChange={setSelectedProducts}
            />

            <MatrixSelect
              label="Metrics"
              options={METRIC_OPTIONS}
              value={selectedMetrics}
              onChange={setSelectedMetrics}
              multiple={selectedProducts.length <= 1}
            />
          </div>

          {/* Chart */}
          {isChartLoading ? (
            <Spinner />
          ) : error ? (
            <div className="text-red-600">Failed to load chart data</div>
          ) : selectedProducts.length === 0 ? (
            <div className="text-gray-600">
              Please select at least one product.
            </div>
          ) : chartData?.products.every((p) => p.data.length === 0) ? (
            "no data for selected date"
          ) : (
            <ProductComparisonChart
              products={chartData?.products ?? []}
              selectedMetrics={selectedMetrics}
            />
          )}
        </SectionLayout>
      </main>
    </>
  );
}
