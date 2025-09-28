"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface DailyData {
  date: string;
  endInventoryQty: number;
  procurementQty: number;
  procurementUnitPrice: number;
  salesQty: number;
  salesUnitPrice: number;
}

interface ProductComparisonChartProps {
  data: DailyData[];
  productName: string;
}

export function ProductComparisonChart({
  data,
  productName,
}: ProductComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data} // 👈 pass full dataset here
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload as DailyData;
              return (
                <div className="bg-white border p-2 rounded shadow text-sm">
                  <p className="font-bold">{label}</p>
                  <p>Inventory: {d.endInventoryQty}</p>
                  <p>
                    Procurement: {d.procurementQty} (Amount: $
                    {(d.procurementUnitPrice * d.procurementQty).toFixed(2)})
                  </p>
                  <p>
                    Sales: {d.salesQty} (Amount: $
                    {(d.salesUnitPrice * d.salesQty).toFixed(2)})
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />

        {/* Each Line corresponds to a field in DailyData */}
        <Line
          type="monotone"
          dataKey="endInventoryQty"
          name={`${productName} Inventory`}
          stroke="#8884d8"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="procurementQty"
          name={`${productName} Procurement`}
          stroke="#ff7300"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="salesQty"
          name={`${productName} Sales`}
          stroke="#413ea0"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
