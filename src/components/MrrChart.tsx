"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MrrChartPoint = {
  month: string;
  revenue: number;
  goal: number | null;
};

export function MrrChart({ data }: { data: MrrChartPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-[var(--border)]"
          />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value) => `$${Number(value).toLocaleString()}`}
          />
          <Legend />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#18181b"
            radius={[4, 4, 0, 0]}
          />
          <Line
            dataKey="goal"
            name="Goal"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
