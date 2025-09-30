"use client";

import { ProductComparisonChart } from "@/components/charts/product-comparison-chart";
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
import { format } from "date-fns";

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

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(() => ({ from: undefined, to: undefined }));

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

  const {
    data: chartData,
    isLoading: isChartLoading,
    error,
  } = useChartData({
    productIds: selectedProducts,
    from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "",
    to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "",
    metrics: selectedMetrics,
  });

  // protect route
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

  // switch between multiple metric selection and single metric selection
  useEffect(() => {
    if (selectedProducts.length > 1) {
      setSelectedMetrics(["sales"]);
    } else {
      setSelectedMetrics(["procurement", "sales", "endInventory"]);
    }
  }, [selectedProducts]);

  // avoid hydration issue
  useEffect(() => {
    const today = new Date();
    setDateRange({ from: today, to: today });
  }, []);

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
            {(dateRange.from || dateRange.to) && (
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                maxDays={7}
              />
            )}

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
            <div className="text-destructive">Failed to load chart data</div>
          ) : selectedProducts.length === 0 ? (
            <div className="text-muted-foreground">
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
