import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/components/DashboardCharts";
import CommissionTable from '@/components/CommissionTable';
import {
  Users,
  DollarSign,
  CalendarDays,
  AlertTriangle,
  Award,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 30;

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ year?: string; month?: string } | undefined> 
}) {
  const resolvedSearchParams = (await searchParams) || {};
  const now = new Date();
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year, 10) : now.getFullYear();
  const month = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month, 10) - 1 : now.getMonth();

  // Start & End of current month
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const warningThresholdDate = new Date();
  warningThresholdDate.setDate(warningThresholdDate.getDate() + 7);

  const [
    revenueAggregate,
    activeCustomersCount,
    totalSessionsCount,
    warningPackages,
    topCustomersLogs,
    trainerLogs,
    revenuesThisMonth,
  ] = await Promise.all([
    prisma.revenue.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.attendanceLog.count({ where: { checkInStatus: "CHECKED_IN" } }),
    prisma.customerPackage.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { remainingSessions: { lte: 3 } },
          {
            AND: [
              { expirationDate: { lte: warningThresholdDate } },
              { expirationDate: { gte: new Date() } },
            ],
          },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { remainingSessions: "asc" },
    }),
    prisma.attendanceLog.groupBy({
      by: ["customerId"],
      _count: { id: true },
      where: { checkInStatus: "CHECKED_IN" },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.attendanceLog.groupBy({
      by: ["trainer"],
      _count: { id: true },
      _sum: { costPerSession: true },
      where: {
        checkInStatus: "CHECKED_IN",
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.revenue.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, amount: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Group revenue by day
  const dailyRevenues: { [key: string]: number } = {};
  
  // Pre-fill all days of the selected month to make the chart continuous
  const lastDayOfSelectedMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDayOfSelectedMonth; i++) {
    const dayStr = `${String(i).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}`;
    dailyRevenues[dayStr] = 0;
  }

  revenuesThisMonth.forEach((rev) => {
    const d = new Date(rev.date);
    const dayStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (dailyRevenues[dayStr] !== undefined) {
      dailyRevenues[dayStr] += rev.amount;
    } else {
      dailyRevenues[dayStr] = rev.amount;
    }
  });

  const revenueTrendData = Object.entries(dailyRevenues).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Dashboard</h2>
          <p className="text-sm text-zinc-400">Tổng quan tình hình kinh doanh của studio Pilates</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard?year=${month === 0 ? year - 1 : year}&month=${month === 0 ? 12 : month}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Tháng trước
          </Link>
          <div className="text-xs text-zinc-400">Tháng {month + 1} / {year}</div>
          <Link
            href={`/dashboard?year=${month === 11 ? year + 1 : year}&month=${month === 11 ? 1 : month + 2}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Tháng sau
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/checkin"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <CalendarDays className="h-4 w-4" />
            Check-in Nhanh
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Doanh thu tháng này</span>
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/10">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-white">
              {monthlyRevenue.toLocaleString("vi-VN")} ₫
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Phát sinh trong tháng {month + 1}</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Khách hàng hoạt động</span>
            <div className="rounded-2xl bg-teal-500/10 p-2.5 text-teal-400 border border-teal-500/10">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-white">{activeCustomersCount}</span>
            <p className="mt-1 text-xs text-zinc-500">Khách đang có trạng thái ACTIVE</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tổng số ca đã check-in</span>
            <div className="rounded-2xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/10">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-white">{totalSessionsCount}</span>
            <p className="mt-1 text-xs text-zinc-500">Số buổi được check-in thành công</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Gói tập cần lưu ý</span>
            <div className={`rounded-2xl p-2.5 border ${
              warningsCount > 0 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/10 animate-pulse' 
                : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-2xl font-bold tracking-tight ${warningsCount > 0 ? "text-amber-400" : "text-white"}`}>
              {warningsCount}
            </span>
            <p className="mt-1 text-xs text-zinc-500">Gói sắp hết buổi (≤3) hoặc sắp hết hạn (≤7 ngày)</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <DashboardCharts revenueTrend={revenueTrendData} trainerStats={trainerStats} />

      {/* Commission calculator table (client) */}
      <div>
        <h3 className="text-base font-bold text-white">Bảng tính hoa hồng HLV theo tháng</h3>
        <p className="text-xs text-zinc-500">Nhập % hoa hồng để tính hoa hồng từng HLV dựa trên tổng giá trị buổi trong tháng</p>
        <div className="mt-3">
          <CommissionTable initialStats={trainerStats} />
        </div>
      </div>

      {/* Leaderboards and alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top customers */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Khách hàng tập nhiều nhất</h3>
              <p className="text-xs text-zinc-500">Xếp hạng theo tổng số ca đã check-in thành công</p>
            </div>
            <Award className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {topCustomers.length === 0 ? (
              <div className="text-center py-6 text-sm text-zinc-500">Chưa có dữ liệu check-in khách hàng</div>
            ) : (
              topCustomers.map((cust, idx) => (
                <div
                  key={cust.id}
                  className="flex items-center justify-between rounded-2xl bg-zinc-950/30 p-4 border border-zinc-800/40 hover:bg-zinc-800/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-800 text-xs font-bold text-zinc-400 border border-zinc-700/50">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{cust.name}</p>
                      <p className="text-xs text-zinc-500">Mã: {cust.code} • Gói: {cust.packagesList}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400">{cust.usedSessions}</span>
                    <span className="text-xs text-zinc-500"> ca tập</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Warning packages list */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Gói tập sắp hết hạn / hết buổi</h3>
              <p className="text-xs text-zinc-500">Danh sách gói tập cần thông báo gia hạn</p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/10">
              {warningsCount} gói tập
            </span>
          </div>
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {warningPackages.length === 0 ? (
              <div className="text-center py-10 text-sm text-zinc-500">
                Tuyệt vời! Không có gói tập nào sắp hết hạn hoặc hết buổi.
              </div>
            ) : (
              warningPackages.map((pkg) => {
                const isLowSessions = pkg.remainingSessions <= 3;
                const isNearExp = pkg.expirationDate && new Date(pkg.expirationDate) <= warningThresholdDate;

                return (
                  <div
                    key={pkg.id}
                    className="flex flex-col gap-2 rounded-2xl bg-zinc-950/30 p-4 border border-zinc-800/40 hover:bg-zinc-800/20 transition-all sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{pkg.customer.name}</p>
                      <p className="text-xs text-zinc-500">Gói: {pkg.packageName} ({pkg.customer.phone})</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {isLowSessions && (
                        <span className="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 border border-red-500/10">
                          Còn lại: {pkg.remainingSessions}/{pkg.totalSessions} buổi
                        </span>
                      )}
                      {isNearExp && pkg.expirationDate && (
                        <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-400 border border-amber-500/10">
                          Hạn dùng: {new Date(pkg.expirationDate).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
