"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  revenue: number;
}

interface TrainerData {
  name: string;
  count: number;
  totalSessionValue?: number;
  commission?: number;
}

interface DashboardChartsProps {
  revenueTrend: ChartData[];
  trainerStats: TrainerData[];
}

export default function DashboardCharts({
  revenueTrend,
  trainerStats,
}: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-80 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 animate-pulse" />
        <div className="h-80 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 animate-pulse" />
      </div>
    );
  }

  // Format currency
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${value / 1000000}M`;
    if (value >= 1000) return `${value / 1000}k`;
    return String(value);
  };

  const formatTooltip = (value: any) => {
    return [Number(value).toLocaleString("vi-VN") + " ₫", "Doanh thu"];
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Revenue Trend Chart */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Xu hướng Doanh thu tháng</h3>
          <p className="text-xs text-zinc-500">Biểu đồ doanh thu phát sinh hàng ngày</p>
        </div>
        <div className="h-72 w-full">
          {revenueTrend.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Không có dữ liệu doanh thu tháng này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={formatTooltip}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trainer Stats Chart */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Hiệu suất Huấn luyện viên</h3>
          <p className="text-xs text-zinc-500">Số ca check-in phụ trách theo HLV</p>
        </div>
        <div className="h-72 w-full">
          {trainerStats.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Chưa có ca dạy nào được check-in
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trainerStats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value, name, props) => {
                    // If the value is numeric and the key is 'commission' or 'totalSessionValue', format as currency
                    if (name === 'commission' || name === 'totalSessionValue') {
                      return [Number(value).toLocaleString('vi-VN') + ' ₫', name === 'commission' ? 'Hoa hồng' : 'Tổng giá trị buổi'];
                    }
                    return [`${value} ca`, 'Số ca dạy'];
                  }}
                />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Commission summary below the chart */}
        {trainerStats.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold text-zinc-300">Hoa hồng HLV (tháng)</h4>
            <div className="grid gap-2">
              {trainerStats.map((t) => (
                <div key={t.name} className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="truncate max-w-[60%]">{t.name}</div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{t.count} ca</div>
                    <div className="text-emerald-400 font-medium">{(t.commission || 0).toLocaleString('vi-VN')} ₫</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
