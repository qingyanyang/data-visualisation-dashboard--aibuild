"use client";

import { useQuery } from "@tanstack/react-query";

export interface ChartDayData {
  date: string;
  procurementQty?: number;
  procurementUnitPrice?: number;
  salesQty?: number;
  salesUnitPrice?: number;
  endInventoryQty?: number;
}

export interface ChartProductData {
  productId: number;
  productName: string;
  data: ChartDayData[];
}

interface ChartApiResponse {
  products: ChartProductData[];
  error?: string;
}

interface UseChartDataParams {
  productIds: number[];
  from: string;
  to: string;
  metrics: ("procurement" | "sales" | "endInventory")[];
  enabled?: boolean;
}

export function useChartData({
  productIds,
  from,
  to,
  metrics,
  enabled = true,
}: UseChartDataParams) {
  return useQuery<ChartApiResponse, Error>({
    queryKey: ["chartData", { productIds, from, to, metrics }],
    queryFn: async () => {
      const params = new URLSearchParams({
        productIds: productIds.join(","),
        from,
        to,
        metrics: metrics.join(","),
      });

      const res = await fetch(`/api/data?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch chart data (${res.status})`);
      }
      return res.json();
    },
    enabled: enabled && productIds.length > 0 && metrics.length > 0,
  });
}
