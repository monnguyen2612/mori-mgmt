"use client";

import { useState, useTransition } from "react";
import { cancelAttendanceLog } from "@/app/dashboard/logs/actions";
import {
  Search,
  Trash2,
  X,
  FileSpreadsheet,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Briefcase,
} from "lucide-react";

interface AttendanceLog {
  id: string;
  date: Date;
  customerId: string;
  customer: {
    code: string;
    name: string;
    phone: string;
  };
  packageName: string;
  trainer: string;
  checkInStatus: string;
  costPerSession: number;
  notes: string | null;
}

interface LogsClientProps {
  initialLogs: AttendanceLog[];
  trainers: string[];
}

export default function LogsClient({ initialLogs, trainers }: LogsClientProps) {
  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);

  // Filters logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.customer.phone.includes(searchTerm) ||
      log.trainer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTrainer =
      trainerFilter === "ALL" || log.trainer === trainerFilter;

    return matchesSearch && matchesTrainer;
  });

  const handleOpenCancelModal = (log: AttendanceLog) => {
    setSelectedLog(log);
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedLog) return;
    startTransition(async () => {
      const res = await cancelAttendanceLog(selectedLog.id);
      if (res.success) {
        setIsCancelModalOpen(false);
        window.location.reload();
      } else {
        alert(res.error || "Có lỗi xảy ra khi hủy ca.");
      }
    });
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFF";
    csvContent += "Thời gian,Mã KH,Khách hàng,SĐT,Gói tập,HLV phụ trách,Chi phí/buổi,Ghi chú\n";

    filteredLogs.forEach((l) => {
      const timeStr = new Date(l.date).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = new Date(l.date).toLocaleDateString("vi-VN");
      const notesClean = l.notes ? l.notes.replace(/"/g, '""') : "";
      csvContent += `"${timeStr} ${dateStr}","${l.customer.code}","${l.customer.name}","${l.customer.phone}","${l.packageName}","${l.trainer}","${l.costPerSession}","${notesClean}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lich_su_checkin_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Nhật ký Điểm danh</h2>
          <p className="text-sm text-zinc-400">Lịch sử ra vào tập luyện chi tiết của học viên và phân bổ ca dạy của HLV</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Xuất Excel/CSV
          </button>
        </div>
      </div>

      {/* Stats Summary cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Sessions */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tổng số ca tập hiển thị</span>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-teal-400">
                {filteredLogs.length} ca dạy
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="h-3.5 w-3.5 text-teal-500" />
            <span>Tập hợp từ nhật ký check-in hệ thống</span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-5 backdrop-blur-sm md:col-span-2 grid gap-4 sm:grid-cols-2 items-center">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Tìm khách, HLV, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Trainer Filter */}
          <div className="flex items-center gap-2 bg-zinc-950/40 rounded-xl border border-zinc-800 px-3 py-1">
            <span className="text-xs text-zinc-500 shrink-0 font-medium uppercase">Huấn luyện viên</span>
            <select
              value={trainerFilter}
              onChange={(e) => setTrainerFilter(e.target.value)}
              className="w-full bg-transparent text-sm text-white focus:outline-none border-none py-1.5 cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900">Tất cả HLV</option>
              {trainers.map((t) => (
                <option key={t} value={t} className="bg-zinc-900">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-900/60 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
              <tr>
                <th className="p-4 pl-6">Thời gian</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Gói tập</th>
                <th className="p-4">Huấn luyện viên (HLV)</th>
                <th className="p-4 text-right">Hao phí gói / Buổi</th>
                <th className="p-4">Ghi chú buổi tập</th>
                <th className="p-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-500">
                    Không tìm thấy lịch sử check-in nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.date);
                  const timeStr = dateObj.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const dateStr = dateObj.toLocaleDateString("vi-VN");

                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-all animate-fade-in">
                      <td className="p-4 pl-6">
                        <div className="font-semibold text-white">{timeStr}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{dateStr}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{log.customer.name}</div>
                        <div className="text-xs font-mono text-zinc-400 mt-0.5">
                          {log.customer.code} • {log.customer.phone}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-zinc-200">
                        {log.packageName}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
                          {log.trainer}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-zinc-400">
                        {log.costPerSession.toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="p-4 max-w-xs truncate text-zinc-400 text-xs" title={log.notes || ""}>
                        {log.notes || <span className="text-zinc-650 italic">Không có ghi chú</span>}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => handleOpenCancelModal(log)}
                          className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                          title="Hủy/Thu hồi điểm danh"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= REVERSE CHECK-IN MODAL ================= */}
      {isCancelModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xác nhận thu hồi điểm danh</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Bạn sắp thu hồi ca điểm danh của học viên <strong className="text-white">{selectedLog.customer.name}</strong> ngày{" "}
                {new Date(selectedLog.date).toLocaleDateString("vi-VN")} dạy bởi <strong className="text-white">{selectedLog.trainer}</strong>.
              </p>
              <div className="mt-4 rounded-xl bg-zinc-950 p-4 text-xs space-y-2 border border-zinc-850">
                <p className="text-emerald-400">✓ <strong>Cộng lại:</strong> +1 buổi tập vào gói của khách hàng.</p>
                <p className="text-red-400">✗ <strong>Xóa bỏ:</strong> Xóa vĩnh viễn nhật ký check-in này.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-transparent px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-650 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xác nhận thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
