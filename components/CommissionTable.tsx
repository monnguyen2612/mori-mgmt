"use client";

import { useState } from "react";

interface TrainerStat {
  name: string;
  count: number;
  totalSessionValue?: number;
  commission?: number;
}

export default function CommissionTable({ initialStats }: { initialStats: TrainerStat[] }) {
  const [percent, setPercent] = useState<number>(50);

  const rate = Math.max(0, Math.min(100, percent)) / 100;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs text-zinc-400">% Hoa hồng cho HLV</label>
        <input
          type="number"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="w-20 rounded-xl bg-zinc-950 border border-zinc-800 py-1 px-2 text-sm text-white"
        />
        <span className="text-xs text-zinc-500">(Nhập 0-100)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-2">HLV</th>
              <th className="p-2 text-right">Số ca</th>
              <th className="p-2 text-right">Tổng giá trị buổi (₫)</th>
              <th className="p-2 text-right">Hoa hồng (₫)</th>
            </tr>
          </thead>
          <tbody>
            {initialStats.map((t) => {
              const total = t.totalSessionValue || 0;
              const comm = Math.round(total * rate);
              return (
                <tr key={t.name} className="border-b border-zinc-850">
                  <td className="p-2 font-semibold text-white">{t.name}</td>
                  <td className="p-2 text-right text-zinc-300">{t.count}</td>
                  <td className="p-2 text-right text-zinc-300">{total.toLocaleString("vi-VN")}</td>
                  <td className="p-2 text-right text-emerald-400 font-semibold">{comm.toLocaleString("vi-VN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
