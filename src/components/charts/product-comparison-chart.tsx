"use client";

import { colorFor } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type MetricType = "procurement" | "sales" | "endInventory";

export interface DailyData {
  date: string;
  endInventoryQty?: number;
  procurementQty?: number;
  procurementUnitPrice?: number;
  salesQty?: number;
  salesUnitPrice?: number;
}

interface Product {
  productId: number;
  productName: string;
  data: DailyData[];
}

interface ProductComparisonChartProps {
  products: Product[];
  selectedMetrics: MetricType[];
}

// Use a separator unlikely to appear in names to build data keys safely
const SEP = "__";

export function ProductComparisonChart({
  products,
  selectedMetrics,
}: ProductComparisonChartProps) {
  // Merge by date; store qty series AND unit prices so tooltip can compute amounts
  const merged: Record<string, any> = {};

  products.forEach((p) => {
    p.data.forEach((d) => {
      if (!merged[d.date]) merged[d.date] = { date: d.date };

      if (selectedMetrics.includes("endInventory")) {
        merged[d.date][`${p.productName}${SEP}endInventory`] =
          d.endInventoryQty ?? 0;
      }
      if (selectedMetrics.includes("procurement")) {
        merged[d.date][`${p.productName}${SEP}procurement`] =
          d.procurementQty ?? 0;
        merged[d.date][`${p.productName}${SEP}procurementUnitPrice`] =
          d.procurementUnitPrice ?? 0;
      }
      if (selectedMetrics.includes("sales")) {
        merged[d.date][`${p.productName}${SEP}sales`] = d.salesQty ?? 0;
        merged[d.date][`${p.productName}${SEP}salesUnitPrice`] =
          d.salesUnitPrice ?? 0;
      }
    });
  });

  const data = Object.values(merged);

  // Build series for only the selected metrics
  const series = products.flatMap((p) =>
    selectedMetrics.map((m) => {
      const metricLabel =
        m === "endInventory"
          ? "Inventory"
          : m === "procurement"
          ? "Procurement"
          : "Sales";
      return {
        dataKey: `${p.productName}${SEP}${m}`,
        unitKey:
          m === "procurement"
            ? `${p.productName}${SEP}procurementUnitPrice`
            : m === "sales"
            ? `${p.productName}${SEP}salesUnitPrice`
            : undefined,
        name: `${p.productName} ${metricLabel}`,
        color: colorFor(`${p.productName}-${m}`),
      };
    })
  );

  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <ReTooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;

            return (
              <div className="bg-white border p-2 rounded shadow text-sm">
                <div className="font-semibold mb-1">{label}</div>
                <div className="space-y-1">
                  {payload.map((item) => {
                    const dk = String(item.dataKey);
                    const [prodName, metricKey] = dk.split(SEP);
                    const qty = Number(item.value ?? 0);
                    let line = null;

                    if (metricKey === "procurement" || metricKey === "sales") {
                      const unitKey =
                        metricKey === "procurement"
                          ? `${prodName}${SEP}procurementUnitPrice`
                          : `${prodName}${SEP}salesUnitPrice`;
                      const unit = Number(
                        (item.payload as any)?.[unitKey] ?? 0
                      );
                      const amount = qty * unit;

                      line = (
                        <div key={dk} className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-sm"
                            style={{ background: item.color }}
                          />
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-auto tabular-nums">
                            Qty: {qty} · Amount: ${amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    } else {
                      // endInventory
                      line = (
                        <div key={dk} className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-sm"
                            style={{ background: item.color }}
                          />
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-auto tabular-nums">
                            Qty: {qty}
                          </span>
                        </div>
                      );
                    }

                    return line;
                  })}
                </div>
              </div>
            );
          }}
        />
        <Legend />
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
