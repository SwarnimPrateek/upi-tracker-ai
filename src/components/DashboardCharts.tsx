"use client";

import React, { useEffect, useState } from "react";
import { useExpenseStore, Transaction } from "@/lib/store";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

interface ChartDataPoint {
  dateLabel: string;
  amount: number;
}

export default function DashboardCharts() {
  const transactions = useExpenseStore((state) => state.transactions);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-center">
        <div className="text-sm text-neutral-500 animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  // Get last 7 days of dates dynamically
  const getLast7DaysData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Sum transactions for this day
      const dailySum = transactions
        .filter((t) => t.transaction_date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        dateLabel: label,
        amount: Number(dailySum.toFixed(2)),
      });
    }

    return data;
  };

  const chartData = getLast7DaysData();
  const totalSpent7Days = chartData.reduce((sum, d) => sum + d.amount, 0);

  // Custom tooltips matching the premium dark aesthetic
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-neutral-950/80 p-3 shadow-xl backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">
            {payload[0].payload.dateLabel}
          </p>
          <p className="text-sm font-bold text-white">
            ₹{payload[0].value?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] p-6 glow-purple">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            Activity (Last 7 Days)
          </h3>
          <p className="text-2xl font-bold text-white mt-1 text-glow">
            ₹{totalSpent7Days.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs text-neutral-400">Live analytics</span>
        </div>
      </div>

      <div className="w-full h-[300px] overflow-hidden">
        {transactions.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-neutral-950/20">
            <p className="text-sm text-neutral-500 text-center px-4">
              No transactions recorded for the last 7 days.<br />
              Upload a receipt screenshot to view details.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="dateLabel"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#c084fc"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#purpleGlow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
