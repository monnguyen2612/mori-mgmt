"use client";

import { useState, useTransition } from "react";
import { checkInCustomer } from "@/app/dashboard/checkin/actions";
import {
  Search,
  UserCheck,
  Calendar,
  Layers,
  Phone,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ClipboardList,
} from "lucide-react";

interface CustomerPackage {
  id: string;
  customerId: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  purchaseDate: Date;
  activationDate: Date | null;
  expirationDate: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  dob: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  packages: CustomerPackage[];
}

interface CheckInClientProps {
  customers: Customer[];
}

export default function CheckInClient({ customers }: CheckInClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [trainer, setTrainer] = useState("HLV Huong");
  const [customTrainer, setCustomTrainer] = useState("");
  const [notes, setNotes] = useState("");
  
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // List of standard trainers
  const standardTrainers = ["HLV Huong", "HLV Hoai", "Khác..."];

  // Filter customers matching search
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCust(c);
    setSuccessMessage(null);
    setErrorMessage(null);
    setNotes("");

    // Auto select first active package with remaining sessions
    const activePkgs = c.packages.filter(
      (p) =>
        p.status === "ACTIVE" &&
        p.remainingSessions > 0 &&
        (!p.expirationDate || new Date(p.expirationDate) >= new Date())
    );

    if (activePkgs.length > 0) {
      setSelectedPackageId(activePkgs[0].id);
    } else if (c.packages.length > 0) {
      setSelectedPackageId(c.packages[0].id);
    } else {
      setSelectedPackageId("");
    }
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    if (!selectedPackageId) {
      setErrorMessage("Vui lòng chọn một gói tập hợp lệ để check-in.");
      return;
    }

    const finalTrainer = trainer === "Khác..." ? customTrainer.trim() : trainer;
    if (!finalTrainer) {
      setErrorMessage("Vui lòng nhập tên Huấn luyện viên.");
      return;
    }

    setSuccessMessage(null);
    setErrorMessage(null);

    const chosenPkg = selectedCust.packages.find((p) => p.id === selectedPackageId);
    if (!chosenPkg) {
      setErrorMessage("Không tìm thấy gói tập được chọn.");
      return;
    }

    startTransition(async () => {
      const res = await checkInCustomer(selectedCust.id, selectedPackageId, finalTrainer, notes);
      if (res.success) {
        const nextRemaining = chosenPkg.remainingSessions - 1;
        setSuccessMessage(
          `Check-in thành công gói "${chosenPkg.packageName}" cho ${selectedCust.name}! Số buổi còn lại: ${nextRemaining}/${chosenPkg.totalSessions}`
        );
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setErrorMessage(res.error || "Gặp lỗi khi điểm danh.");
      }
    });
  };

  const activePackage = selectedCust?.packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Check-in Điểm Danh Nhanh</h2>
        <p className="text-sm text-zinc-400">Tìm kiếm khách hàng đến tập và trừ buổi theo gói tập được lựa chọn</p>
      </div>

      {/* Success/Error Toasts */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div className="font-semibold text-sm">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
          <div className="font-semibold text-sm">{errorMessage}</div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left Column: Search & Customer List (2/5 size) */}
        <div className="md:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4 backdrop-blur-sm flex flex-col max-h-[600px]">
          <h3 className="text-base font-bold text-white">Tìm khách hàng</h3>
          
          {/* Search Box */}
          <div className="relative shrink-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Nhập tên, SĐT hoặc mã KH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Customer list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500">
                Không tìm thấy khách hàng nào khớp với tìm kiếm.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isActive = selectedCust?.id === c.id;
                const totalRemaining = c.packages.reduce((sum, p) => sum + p.remainingSessions, 0);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/50 text-emerald-400"
                        : "bg-zinc-950/40 border-zinc-850 text-zinc-300 hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold truncate ${isActive ? "text-emerald-400" : "text-white"}`}>
                          {c.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Mã: {c.code} • SĐT: {c.phone}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-bold ${totalRemaining <= 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {totalRemaining}
                        </span>
                        <span className="text-[10px] text-zinc-500"> ca còn lại</span>
                      </div>
                    </div>

                    {/* Packages badges */}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {c.packages && c.packages.length > 0 ? (
                        c.packages.map((p) => {
                          const isLow = p.remainingSessions <= 3;
                          const isExpired = p.expirationDate && new Date(p.expirationDate) < new Date();
                          return (
                            <span
                              key={p.id}
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium border ${
                                p.status === "ACTIVE" && p.remainingSessions > 0 && !isExpired
                                  ? isLow
                                    ? "bg-amber-500/5 text-amber-400/90 border-amber-500/20"
                                    : "bg-emerald-500/5 text-emerald-400/90 border-emerald-500/20"
                                  : "bg-zinc-950 text-zinc-500 border-zinc-900"
                              }`}
                            >
                              {p.packageName} ({p.remainingSessions})
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[9px] text-zinc-500 italic">Chưa mua gói</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail Card & Check-in form (3/5 size) */}
        <div className="md:col-span-3 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm flex flex-col justify-center min-h-[400px]">
          {!selectedCust ? (
            <div className="text-center py-20 text-zinc-500 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/40 text-zinc-400 border border-zinc-700/50">
                <UserCheck className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-300">Chưa chọn khách hàng</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Vui lòng nhấp chọn một khách hàng ở danh sách bên trái để mở bảng điểm danh check-in.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckInSubmit} className="space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-400" />
                Phiếu Điểm Danh Chi Tiết
              </h3>

              {/* Profile Box */}
              <div className="rounded-2xl bg-zinc-950/50 border border-zinc-800/80 p-5 space-y-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Họ và tên khách hàng</span>
                  <div className="text-lg font-bold text-white mt-0.5">{selectedCust.name}</div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                    <Phone className="h-3.5 w-3.5" /> {selectedCust.phone} • {selectedCust.code}
                  </div>
                </div>

                {/* Package Selection Cards */}
                <div className="space-y-2 border-t border-zinc-800/60 pt-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Chọn gói tập điểm danh *</span>
                  {selectedCust.packages && selectedCust.packages.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedCust.packages.map((pkg) => {
                        const isSelected = selectedPackageId === pkg.id;
                        const isExpired = pkg.expirationDate && new Date(pkg.expirationDate) < new Date();
                        const isDisabled =
                          pkg.remainingSessions <= 0 ||
                          pkg.status === "INACTIVE" ||
                          isExpired;
                        const isLow = pkg.remainingSessions <= 3 && pkg.remainingSessions > 0;

                        return (
                          <div
                            key={pkg.id}
                            onClick={() => {
                              if (!isDisabled) {
                                setSelectedPackageId(pkg.id);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[100px] ${
                              isDisabled
                                ? "bg-zinc-950/20 border-zinc-900 opacity-40 cursor-not-allowed"
                                : isSelected
                                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500 text-emerald-400 cursor-pointer shadow-md shadow-emerald-500/5"
                                : "bg-zinc-950/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900/40 cursor-pointer"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className={`font-bold text-xs truncate ${isSelected ? "text-emerald-400" : "text-white"}`}>
                                  {pkg.packageName}
                                </span>
                                {isDisabled && (
                                  <span className="text-[8px] font-bold text-red-400 border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded">
                                    Không khả dụng
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-zinc-500 block">ID: {pkg.id.substring(0, 8)}...</span>
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-850 pt-2.5 mt-2 text-xs">
                              <span>
                                Buổi: <strong className={isLow ? "text-red-400 font-extrabold" : isSelected ? "text-emerald-400" : "text-zinc-200"}>{pkg.remainingSessions}</strong>/{pkg.totalSessions}
                              </span>
                              <span>
                                Hạn: {pkg.expirationDate ? (
                                  <span className={isExpired ? "text-red-400 font-semibold" : "text-zinc-400"}>
                                    {new Date(pkg.expirationDate).toLocaleDateString("vi-VN")}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 italic">Không hạn</span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-4 text-center text-xs text-red-400">
                      Khách hàng này hiện chưa đăng ký bất kỳ gói tập nào.
                    </div>
                  )}
                </div>

                {/* Selected Package Status warning */}
                {activePackage && (
                  <div className="border-t border-zinc-800/60 pt-4 flex items-center justify-between text-xs text-zinc-400">
                    <span>Trạng thái gói lựa chọn:</span>
                    <div>
                      {activePackage.remainingSessions <= 0 ? (
                        <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400 border border-red-500/20">
                          Đã hết ca tập
                        </span>
                      ) : activePackage.remainingSessions <= 3 ? (
                        <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Sắp hết buổi (Còn {activePackage.remainingSessions} ca)
                        </span>
                      ) : (
                        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                          Hợp lệ & Sẵn sàng
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Trainer select field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Huấn luyện viên (HLV) phụ trách ca dạy *</label>
                <div className="grid gap-3 sm:grid-cols-4">
                  {standardTrainers.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTrainer(t);
                        if (t !== "Khác...") setCustomTrainer("");
                      }}
                      className={`rounded-xl border py-2.5 text-xs font-semibold text-center transition-all cursor-pointer ${
                        trainer === t
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {trainer === "Khác..." && (
                  <div className="relative pt-1">
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên HLV dạy..."
                      value={customTrainer}
                      onChange={(e) => setCustomTrainer(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ghi chú buổi tập này</label>
                <textarea
                  placeholder="Ghi chú sức khỏe hôm nay, chấn thương hoặc các bài tập tập trung..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Checkin Submit button */}
              <div className="border-t border-zinc-800 pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isPending || !activePackage || activePackage.remainingSessions <= 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang điểm danh...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Xác nhận Điểm danh (Check-in)
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
