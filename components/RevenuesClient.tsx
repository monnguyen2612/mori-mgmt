"use client";

import { useState, useTransition } from "react";
import { createRevenue, deleteRevenue } from "@/app/dashboard/revenues/actions";
import {
  Search,
  Plus,
  Trash2,
  X,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
}

interface Revenue {
  id: string;
  date: Date;
  customerId: string;
  customer: {
    code: string;
    name: string;
    phone: string;
  };
  packageName: string;
  totalSessions: number;
  amount: number;
  pricePerSession: number;
  paymentMethod: string;
  salesperson: string;
  notes: string | null;
}

interface RevenuesClientProps {
  initialRevenues: Revenue[];
  customers: Customer[];
}

export default function RevenuesClient({
  initialRevenues,
  customers,
}: RevenuesClientProps) {
  const [revenues, setRevenues] = useState<Revenue[]>(initialRevenues);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);

  // Auto-complete customer search inside Modal
  const [custSearch, setCustSearch] = useState("");
  const [filteredCusts, setFilteredCusts] = useState<Customer[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    customerId: "",
    packageName: "",
    totalSessions: "10",
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    salesperson: "",
    date: new Date().toISOString().substring(0, 10),
    notes: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle Customer Selection
  const handleCustSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustSearch(val);
    if (val.trim() === "") {
      setFilteredCusts([]);
      return;
    }

    const filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(val.toLowerCase()) ||
        c.phone.includes(val) ||
        c.code.toLowerCase().includes(val.toLowerCase())
    );
    setFilteredCusts(filtered.slice(0, 5)); // show max 5 matches
  };

  const selectCustomer = (c: Customer) => {
    setFormData({ ...formData, customerId: c.id });
    setCustSearch(`${c.name} (${c.code} - ${c.phone})`);
    setFilteredCusts([]);
  };

  // Filters logic
  const filteredRevenues = revenues.filter((rev) => {
    const matchesSearch =
      rev.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.customer.phone.includes(searchTerm) ||
      rev.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.salesperson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment =
      paymentFilter === "ALL" || rev.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Sum amount
  const totalFilteredAmount = filteredRevenues.reduce((acc, curr) => acc + curr.amount, 0);

  const handleOpenAddModal = () => {
    setFormData({
      customerId: "",
      packageName: "",
      totalSessions: "10",
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      salesperson: "",
      date: new Date().toISOString().substring(0, 10),
      notes: "",
    });
    setCustSearch("");
    setFilteredCusts([]);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenDeleteModal = (rev: Revenue) => {
    setSelectedRevenue(rev);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError("Vui lòng tìm và chọn khách hàng từ danh sách gợi ý.");
      return;
    }
    if (!formData.packageName.trim()) {
      setFormError("Vui lòng nhập tên gói tập.");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError("Vui lòng nhập số tiền hợp lệ (> 0).");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      const res = await createRevenue(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "Có lỗi xảy ra.");
      }
    });
  };

  const handleDeleteSubmit = async () => {
    if (!selectedRevenue) return;
    startTransition(async () => {
      const res = await deleteRevenue(selectedRevenue.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        window.location.reload();
      } else {
        alert(res.error || "Có lỗi xảy ra khi xóa.");
      }
    });
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFF";
    csvContent += "Mã KH,Khách hàng,Gói tập,Tổng buổi,Số tiền,Đơn giá/Buổi,Hình thức,Ngày bán,Nhân viên,Ghi chú\n";

    filteredRevenues.forEach((r) => {
      const dateStr = new Date(r.date).toLocaleDateString("vi-VN");
      const notesClean = r.notes ? r.notes.replace(/"/g, '""') : "";
      csvContent += `"${r.customer.code}","${r.customer.name}","${r.packageName}","${r.totalSessions}","${r.amount}","${r.pricePerSession}","${r.paymentMethod}","${dateStr}","${r.salesperson}","${notesClean}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_doanh_thu_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">Chuyển khoản</span>;
      case "CASH":
        return <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">Tiền mặt</span>;
      case "CARD":
        return <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">Quẹt thẻ</span>;
      default:
        return <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{method}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Nhật ký Doanh thu</h2>
          <p className="text-sm text-zinc-400">Ghi nhận các hóa đơn, các giao dịch mua gói tập của khách hàng</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Xuất Excel/CSV
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Ghi nhận Doanh Thu
          </button>
        </div>
      </div>

      {/* Overview Cards & filters */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* KPI: Total revenue currently filtered */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tổng doanh thu hiện tại</span>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-400">
                {totalFilteredAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>Tính trên tổng số {filteredRevenues.length} hóa đơn hiển thị</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-5 backdrop-blur-sm md:col-span-2 grid gap-4 sm:grid-cols-2 items-center">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Tìm khách hàng, gói tập, người bán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2 bg-zinc-950/40 rounded-xl border border-zinc-800 px-3 py-1">
            <span className="text-xs text-zinc-500 shrink-0 font-medium uppercase">Thanh toán</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-transparent text-sm text-white focus:outline-none border-none py-1.5 cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900">Tất cả</option>
              <option value="BANK_TRANSFER" className="bg-zinc-900">Chuyển khoản</option>
              <option value="CASH" className="bg-zinc-900">Tiền mặt</option>
              <option value="CARD" className="bg-zinc-900">Quẹt thẻ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Revenues Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-900/60 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
              <tr>
                <th className="p-4 pl-6">Khách hàng</th>
                <th className="p-4">Gói tập mua</th>
                <th className="p-4 text-center">Số buổi</th>
                <th className="p-4 text-right">Số tiền</th>
                <th className="p-4 text-right">Giá / Buổi</th>
                <th className="p-4">Hình thức</th>
                <th className="p-4">Ngày giao dịch / Người bán</th>
                <th className="p-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredRevenues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-zinc-500">
                    Không có nhật ký giao dịch nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                filteredRevenues.map((rev) => (
                  <tr key={rev.id} className="hover:bg-zinc-900/40 transition-all">
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-white">{rev.customer.name}</div>
                      <div className="text-xs font-mono text-zinc-400 mt-0.5">
                        {rev.customer.code} • {rev.customer.phone}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-zinc-200">
                      {rev.packageName}
                    </td>
                    <td className="p-4 text-center text-zinc-300 font-semibold">
                      {rev.totalSessions} buổi
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400 text-base">
                      {rev.amount.toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="p-4 text-right font-medium text-zinc-400">
                      {rev.pricePerSession.toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="p-4">
                      {getPaymentBadge(rev.paymentMethod)}
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-zinc-300">
                        {new Date(rev.date).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        Bán bởi: {rev.salesperson}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => handleOpenDeleteModal(rev)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                        title="Xóa hóa đơn"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD REVENUE MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                Ghi nhận Giao dịch Doanh Thu
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              {/* Customer search selection */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Chọn khách hàng *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập tên, SĐT hoặc mã để tìm kiếm..."
                    value={custSearch}
                    onChange={handleCustSearchChange}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Dropdown Suggestions */}
                {filteredCusts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden divide-y divide-zinc-900">
                    {filteredCusts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="p-3 text-xs text-zinc-300 hover:bg-zinc-900 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-white text-sm">{c.name}</strong> • SĐT: {c.phone}
                        </div>
                        <span className="font-mono text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {c.code}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {formData.customerId && (
                  <p className="text-[10px] text-emerald-400 font-semibold">✓ Đã liên kết thành công khách hàng.</p>
                )}
              </div>

              {/* Tên gói */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tên gói tập bán *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Gói VIP 30 buổi"
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Grid: Tổng buổi & Số tiền */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng số buổi</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalSessions}
                    onChange={(e) => setFormData({ ...formData, totalSessions: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng số tiền (VND) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="15000000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Price per session indicator (small) */}
              {parseFloat(formData.amount) > 0 && parseInt(formData.totalSessions) > 0 && (
                <div className="text-xs text-zinc-400 bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-2 flex items-center justify-between">
                  <span>Đơn giá ≈</span>
                  <strong className="text-emerald-400 text-sm">
                    {(parseFloat(formData.amount) / parseInt(formData.totalSessions)).toLocaleString("vi-VN")} ₫
                  </strong>
                </div>
              )}

              {/* Advanced toggle: hide optional fields to keep modal short */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white"
                >
                  <ArrowRight className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
                  {showAdvanced ? "Ẩn tùy chọn" : "Hiển thị thêm tùy chọn"}
                </button>
                <span className="text-[11px] text-zinc-500">Tùy chọn ẩn giúp form ngắn gọn hơn</span>
              </div>

              {showAdvanced && (
                <>
                  {/* Grid: Hình thức, Ngày */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hình thức thanh toán</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="BANK_TRANSFER" className="bg-zinc-900">Chuyển khoản</option>
                        <option value="CASH" className="bg-zinc-900">Tiền mặt</option>
                        <option value="CARD" className="bg-zinc-900">Quẹt thẻ</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày giao dịch</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nhân viên bán hàng</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Admin Mori, Staff Hana..."
                      value={formData.salesperson}
                      onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Ghi chú */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ghi chú</label>
                    <textarea
                      placeholder="Thông tin thêm về giao dịch..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </>
              )}

              <div className="bg-amber-500/10 border border-amber-500/10 rounded-xl p-3 text-[10.5px] text-amber-400">
                ⚠️ <strong>Lưu ý:</strong> Khi lưu hóa đơn, một gói tập mới sẽ tự động được thêm vào tài khoản của khách hàng được chọn, trạng thái khách hàng sẽ chuyển thành Hoạt Động (ACTIVE).
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-transparent px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {isDeleteModalOpen && selectedRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xác nhận xóa hóa đơn</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Bạn có chắc chắn muốn xóa hóa đơn trị giá{" "}
                <strong className="text-white">{selectedRevenue.amount.toLocaleString("vi-VN")} ₫</strong> của khách hàng{" "}
                <strong className="text-white">{selectedRevenue.customer.name}</strong>?
                Hành động này chỉ xóa bản ghi doanh thu và KHÔNG ảnh hưởng hay khôi phục lại gói tập của khách hàng.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-transparent px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-650 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
