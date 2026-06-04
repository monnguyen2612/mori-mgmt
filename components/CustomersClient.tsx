"use client";

import { useState, useTransition } from "react";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerPackage,
  updateCustomerPackage,
  deleteCustomerPackage,
} from "@/app/dashboard/customers/actions";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Phone,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  DollarSign,
  ArrowLeft,
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

interface CustomersClientProps {
  initialCustomers: Customer[];
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [warningFilter, setWarningFilter] = useState("ALL"); // ALL, LOW_SESSIONS, NEAR_EXPIRY, ANY_WARNING
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CustomerPackage | null>(null);
  const [pkgTab, setPkgTab] = useState<"list" | "add" | "edit">("list");

  // Customer Form states
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    dob: "",
    currentPackage: "",
    totalSessions: "10",
    usedSessions: "0",
    purchaseDate: new Date().toISOString().substring(0, 10),
    activationDate: new Date().toISOString().substring(0, 10),
    expirationDate: "",
    status: "ACTIVE",
    notes: "",
    paymentAmount: "0",
    paymentMethod: "BANK_TRANSFER",
    salesperson: "",
  });

  // Package Form states
  const [pkgFormData, setPkgFormData] = useState({
    packageName: "",
    totalSessions: "10",
    usedSessions: "0",
    paymentAmount: "0",
    paymentMethod: "BANK_TRANSFER",
    salesperson: "",
    purchaseDate: new Date().toISOString().substring(0, 10),
    activationDate: new Date().toISOString().substring(0, 10),
    expirationDate: "",
    status: "ACTIVE",
    notes: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Helper date threshold for warnings (7 days)
  const warningDateLimit = new Date();
  warningDateLimit.setDate(warningDateLimit.getDate() + 7);

  // Check warnings helpers
  const isPkgNearOut = (pkg: CustomerPackage) => pkg.status === "ACTIVE" && pkg.remainingSessions <= 3;
  const isPkgNearExpired = (pkg: CustomerPackage) =>
    pkg.status === "ACTIVE" &&
    !!pkg.expirationDate &&
    new Date(pkg.expirationDate) <= warningDateLimit &&
    new Date(pkg.expirationDate) >= new Date();

  const customerHasNearOutPkg = (cust: Customer) => cust.packages.some(isPkgNearOut);
  const customerHasNearExpiredPkg = (cust: Customer) => cust.packages.some(isPkgNearExpired);

  // Filter customers
  const filteredCustomers = customers.filter((cust) => {
    // 1. Search name or phone
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm);

    // 2. Status filter
    const matchesStatus = statusFilter === "ALL" || cust.status === statusFilter;

    // 3. Warning filter
    let matchesWarning = true;
    if (warningFilter === "LOW_SESSIONS") {
      matchesWarning = customerHasNearOutPkg(cust);
    } else if (warningFilter === "NEAR_EXPIRY") {
      matchesWarning = customerHasNearExpiredPkg(cust);
    } else if (warningFilter === "ANY_WARNING") {
      matchesWarning = customerHasNearOutPkg(cust) || customerHasNearExpiredPkg(cust);
    }

    return matchesSearch && matchesStatus && matchesWarning;
  });

  // CUSTOMER HANDLERS
  const handleOpenAddModal = () => {
    setFormData({
      code: "",
      name: "",
      phone: "",
      dob: "",
      currentPackage: "",
      totalSessions: "10",
      usedSessions: "0",
      purchaseDate: new Date().toISOString().substring(0, 10),
      activationDate: new Date().toISOString().substring(0, 10),
      expirationDate: "",
      status: "ACTIVE",
      notes: "",
      paymentAmount: "0",
      paymentMethod: "BANK_TRANSFER",
      salesperson: "",
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setFormData({
      code: cust.code,
      name: cust.name,
      phone: cust.phone,
      dob: cust.dob ? new Date(cust.dob).toISOString().substring(0, 10) : "",
      currentPackage: "", // Unused in customer edit
      totalSessions: "0",
      usedSessions: "0",
      purchaseDate: "",
      activationDate: "",
      expirationDate: "",
      status: cust.status,
      notes: cust.notes || "",
      paymentAmount: "0",
      paymentMethod: "BANK_TRANSFER",
      salesperson: "",
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError("Vui lòng nhập Họ tên và Số điện thoại.");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        const res = await createCustomer(formData);
        if (res && res.success) {
          setIsAddModalOpen(false);
          window.location.reload();
        } else {
          setFormError(res?.error || "Có lỗi xảy ra.");
        }
      } catch (err: any) {
        setFormError(err?.message || "Có lỗi xảy ra khi gửi yêu cầu.");
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError("Vui lòng nhập Họ tên và Số điện thoại.");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        const res = await updateCustomer(selectedCustomer.id, formData);
        if (res && res.success) {
          setIsEditModalOpen(false);
          window.location.reload();
        } else {
          setFormError(res?.error || "Có lỗi xảy ra.");
        }
      } catch (err: any) {
        setFormError(err?.message || "Có lỗi xảy ra khi gửi yêu cầu.");
      }
    });
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCustomer) return;
    startTransition(async () => {
      try {
        const res = await deleteCustomer(selectedCustomer.id);
        if (res && res.success) {
          setIsDeleteModalOpen(false);
          window.location.reload();
        } else {
          alert(res?.error || "Có lỗi xảy ra khi xóa.");
        }
      } catch (err: any) {
        alert(err?.message || "Có lỗi xảy ra khi xóa.");
      }
    });
  };

  // PACKAGE MANAGEMENT HANDLERS
  const handleOpenPkgModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setSelectedPackage(null);
    setPkgTab("list");
    setIsPkgModalOpen(true);
  };

  const handleOpenAddPkg = () => {
    setPkgFormData({
      packageName: "",
      totalSessions: "10",
      usedSessions: "0",
      paymentAmount: "0",
      paymentMethod: "BANK_TRANSFER",
      salesperson: "",
      purchaseDate: new Date().toISOString().substring(0, 10),
      activationDate: new Date().toISOString().substring(0, 10),
      expirationDate: "",
      status: "ACTIVE",
      notes: "",
    });
    setFormError(null);
    setPkgTab("add");
  };

  const handleOpenEditPkg = (pkg: CustomerPackage) => {
    setSelectedPackage(pkg);
    setPkgFormData({
      packageName: pkg.packageName,
      totalSessions: String(pkg.totalSessions),
      usedSessions: String(pkg.usedSessions),
      paymentAmount: "0",
      paymentMethod: "BANK_TRANSFER",
      salesperson: "",
      purchaseDate: pkg.purchaseDate ? new Date(pkg.purchaseDate).toISOString().substring(0, 10) : "",
      activationDate: pkg.activationDate ? new Date(pkg.activationDate).toISOString().substring(0, 10) : "",
      expirationDate: pkg.expirationDate ? new Date(pkg.expirationDate).toISOString().substring(0, 10) : "",
      status: pkg.status,
      notes: pkg.notes || "",
    });
    setFormError(null);
    setPkgTab("edit");
  };

  const handleAddPkgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!pkgFormData.packageName.trim()) {
      setFormError("Vui lòng nhập tên gói tập.");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        const payload = {
          ...pkgFormData,
          customerId: selectedCustomer.id,
        };
        const res = await addCustomerPackage(payload);
        if (res && res.success) {
          window.location.reload();
        } else {
          setFormError(res?.error || "Không thể thêm gói tập.");
        }
      } catch (err: any) {
        setFormError(err?.message || "Có lỗi xảy ra.");
      }
    });
  };

  const handleEditPkgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    if (!pkgFormData.packageName.trim()) {
      setFormError("Vui lòng nhập tên gói tập.");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        const res = await updateCustomerPackage(selectedPackage.id, pkgFormData);
        if (res && res.success) {
          window.location.reload();
        } else {
          setFormError(res?.error || "Không thể cập nhật gói tập.");
        }
      } catch (err: any) {
        setFormError(err?.message || "Có lỗi xảy ra.");
      }
    });
  };

  const handleDeletePkgSubmit = async (pkgId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa gói tập này? Hành động này sẽ xóa vĩnh viễn lịch sử check-in liên quan.")) return;
    startTransition(async () => {
      try {
        const res = await deleteCustomerPackage(pkgId);
        if (res && res.success) {
          window.location.reload();
        } else {
          alert(res?.error || "Không thể xóa gói tập.");
        }
      } catch (err: any) {
        alert(err?.message || "Có lỗi xảy ra.");
      }
    });
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // BOM for Excel UTF-8 support
    csvContent += "Mã KH,Họ tên,SĐT,Sinh nhật,Trạng thái KH,Danh sách gói tập,Ghi chú\n";

    filteredCustomers.forEach((c) => {
      const dobStr = c.dob ? new Date(c.dob).toLocaleDateString("vi-VN") : "";
      const pkgsStr = c.packages && c.packages.length > 0
        ? c.packages
            .map(
              (p) =>
                `${p.packageName} (${p.remainingSessions}/${p.totalSessions} ca, Hạn: ${
                  p.expirationDate ? new Date(p.expirationDate).toLocaleDateString("vi-VN") : "Không hạn"
                })`
            )
            .join(" | ")
        : "Chưa mua gói";
      const notesClean = c.notes ? c.notes.replace(/"/g, '""') : "";
      
      csvContent += `"${c.code}","${c.name}","${c.phone}","${dobStr}","${c.status}","${pkgsStr}","${notesClean}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `danh_sach_khach_hang_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Hoạt động
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400 border border-zinc-700/50">
            <X className="h-3 w-3" /> Ngưng tập
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" /> Hết hạn
          </span>
        );
      case "OUT_OF_SESSIONS":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
            <AlertCircle className="h-3 w-3" /> Hết buổi
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Danh sách Khách hàng</h2>
          <p className="text-sm text-zinc-400">Quản lý hồ sơ khách hàng và các gói tập đa nhiệm đồng thời</p>
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
            Thêm Khách Hàng
          </button>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="grid gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/20 p-5 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tên, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-zinc-950/40 rounded-xl border border-zinc-800 px-3 py-1">
          <span className="text-xs text-zinc-500 shrink-0 font-medium uppercase">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent text-sm text-white focus:outline-none border-none py-1.5 cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900 text-white">Tất cả</option>
            <option value="ACTIVE" className="bg-zinc-900 text-white">Đang hoạt động</option>
            <option value="INACTIVE" className="bg-zinc-900 text-white">Ngưng tập</option>
          </select>
        </div>

        {/* Warning Filter */}
        <div className="flex items-center gap-2 bg-zinc-950/40 rounded-xl border border-zinc-800 px-3 py-1">
          <span className="text-xs text-zinc-500 shrink-0 font-medium uppercase">Cảnh báo gói</span>
          <select
            value={warningFilter}
            onChange={(e) => setWarningFilter(e.target.value)}
            className="w-full bg-transparent text-sm text-white focus:outline-none border-none py-1.5 cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900 text-white">Tất cả</option>
            <option value="LOW_SESSIONS" className="bg-zinc-900 text-white">Sắp hết buổi (≤ 3 ca)</option>
            <option value="NEAR_EXPIRY" className="bg-zinc-900 text-white">Sắp hết hạn (≤ 7 ngày)</option>
            <option value="ANY_WARNING" className="bg-zinc-900 text-white">Có cảnh báo bất kỳ</option>
          </select>
        </div>

        {/* Total counts helper */}
        <div className="flex items-center justify-end text-xs text-zinc-400 font-semibold px-2">
          Hiển thị: {filteredCustomers.length} / {customers.length} khách hàng
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-900/60 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
              <tr>
                <th className="p-4 pl-6">Mã KH</th>
                <th className="p-4">Khách hàng / SĐT</th>
                <th className="p-4">Danh sách Gói tập</th>
                <th className="p-4 text-center">Trạng thái KH</th>
                <th className="p-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-zinc-500">
                    Không tìm thấy khách hàng nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const nearOut = customerHasNearOutPkg(cust);
                  const nearExp = customerHasNearExpiredPkg(cust);
                  const hasWarning = nearOut || nearExp;

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-zinc-900/40 transition-all ${
                        hasWarning ? "bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      <td className="p-4 pl-6 font-mono font-bold text-zinc-400">
                        {cust.code}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{cust.name}</div>
                        <div className="flex flex-col gap-1 text-xs text-zinc-400 mt-1">
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            {cust.phone}
                          </span>
                          {cust.dob && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 shrink-0" />
                              NS: {new Date(cust.dob).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-md">
                        <div className="flex flex-col gap-2">
                          {cust.packages && cust.packages.length > 0 ? (
                            cust.packages.map((pkg) => {
                              const pkgNearOut = isPkgNearOut(pkg);
                              const pkgNearExp = isPkgNearExpired(pkg);
                              return (
                                <div
                                  key={pkg.id}
                                  className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/30 p-2.5 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-zinc-200">{pkg.packageName}</span>
                                    {getStatusBadge(pkg.status)}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-400">
                                    <span>
                                      Buổi:{" "}
                                      <strong
                                        className={
                                          pkgNearOut ? "text-red-400 font-extrabold" : "text-emerald-400"
                                        }
                                      >
                                        {pkg.remainingSessions}
                                      </strong>
                                      /{pkg.totalSessions}
                                    </span>
                                    <span className="text-zinc-700">•</span>
                                    <span>
                                      Hạn:{" "}
                                      {pkg.expirationDate ? (
                                        <span
                                          className={
                                            pkgNearExp
                                              ? "text-amber-400 font-bold"
                                              : new Date(pkg.expirationDate) < new Date()
                                              ? "text-red-400"
                                              : "text-zinc-400"
                                          }
                                        >
                                          {new Date(pkg.expirationDate).toLocaleDateString("vi-VN")}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-500 italic">Không giới hạn</span>
                                      )}
                                    </span>
                                  </div>
                                  {(pkgNearOut || pkgNearExp) && (
                                    <div className="flex gap-1.5 mt-0.5">
                                      {pkgNearOut && (
                                        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/10">
                                          Sắp hết ca
                                        </span>
                                      )}
                                      {pkgNearExp && (
                                        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10">
                                          Sắp hết hạn
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-zinc-500 text-xs italic">Chưa mua gói tập nào</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(cust.status)}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPkgModal(cust)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                            title="Quản lý các gói tập"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            Gói tập ({cust.packages?.length || 0})
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(cust)}
                            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                            title="Sửa khách hàng"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(cust)}
                            className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                            title="Xóa khách hàng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD CUSTOMER MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                Thêm Khách Hàng Mới
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

            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Họ tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SĐT *</label>
                  <input
                    type="text"
                    required
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mã Khách Hàng</label>
                  <input
                    type="text"
                    placeholder="Để trống để tự tạo (KHXXXX)"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sinh nhật</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="border-t border-zinc-800/60 sm:col-span-2 pt-4">
                  <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-1.5">
                    <Layers className="h-4 w-4" /> Đăng ký Gói tập đầu tiên (Tùy chọn)
                  </h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tên gói tập</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Gói VIP 30 ca máy"
                    value={formData.currentPackage}
                    onChange={(e) => setFormData({ ...formData, currentPackage: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

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
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày mua</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hạn sử dụng</label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày kích hoạt</label>
                  <input
                    type="date"
                    value={formData.activationDate}
                    onChange={(e) => setFormData({ ...formData, activationDate: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trạng thái ban đầu</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="ACTIVE" className="bg-zinc-900">Hoạt động (Active)</option>
                    <option value="INACTIVE" className="bg-zinc-900">Ngưng hoạt động (Inactive)</option>
                  </select>
                </div>

                <div className="border-t border-zinc-800/60 sm:col-span-2 pt-4">
                  <h4 className="text-sm font-bold text-teal-400 mb-4 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" /> Ghi nhận Thanh toán (Tạo doanh thu tự động)
                  </h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Số tiền thanh toán (VND)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.paymentAmount}
                    onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-zinc-500">Nhập số tiền &gt; 0 để tự tạo hóa đơn trong Doanh thu.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hình thức thanh toán</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="BANK_TRANSFER" className="bg-zinc-900">Chuyển khoản (Bank Transfer)</option>
                    <option value="CASH" className="bg-zinc-900">Tiền mặt (Cash)</option>
                    <option value="CARD" className="bg-zinc-900">Quẹt thẻ (Card)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nhân viên tư vấn bán gói</label>
                  <input
                    type="text"
                    placeholder="Tên nhân viên tư vấn bán gói..."
                    value={formData.salesperson}
                    onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ghi chú khách hàng</label>
                  <textarea
                    placeholder="Mô tả đặc điểm sức khỏe, chấn thương hoặc lưu ý riêng..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

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
                  Lưu khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT CUSTOMER MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-emerald-400" />
                Sửa Thông Tin Khách Hàng
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
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

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Họ tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SĐT *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mã Khách Hàng *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sinh nhật</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trạng thái KH</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="ACTIVE" className="bg-zinc-900">Hoạt động (Active)</option>
                    <option value="INACTIVE" className="bg-zinc-900">Ngưng tập (Inactive)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PACKAGE MANAGEMENT MODAL ================= */}
      {isPkgModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-400" />
                  Quản lý gói tập
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Khách hàng: <strong className="text-white">{selectedCustomer.name}</strong> ({selectedCustomer.code})
                </p>
              </div>
              <button
                onClick={() => setIsPkgModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error notifications */}
            {formError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* TAB: LIST */}
            {pkgTab === "list" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-300">Danh sách gói tập đang sở hữu</h4>
                  <button
                    onClick={handleOpenAddPkg}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Mua / Thêm gói tập mới
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedCustomer.packages && selectedCustomer.packages.length > 0 ? (
                    selectedCustomer.packages.map((pkg) => {
                      const isLow = isPkgNearOut(pkg);
                      const isExp = isPkgNearExpired(pkg);
                      return (
                        <div
                          key={pkg.id}
                          className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3 hover:border-zinc-700 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-bold text-white text-sm">{pkg.packageName}</h5>
                              <p className="text-[10px] text-zinc-500 mt-0.5">ID Gói: {pkg.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(pkg.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-900/40 p-3 text-xs">
                            <div>
                              <span className="text-zinc-500">Số buổi tập:</span>
                              <div className="text-sm font-semibold text-white mt-0.5">
                                Còn <strong className={isLow ? "text-red-400 font-extrabold" : "text-emerald-400"}>{pkg.remainingSessions}</strong> / {pkg.totalSessions} ca
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500">Hạn sử dụng:</span>
                              <div className="text-sm font-semibold text-white mt-0.5">
                                {pkg.expirationDate ? (
                                  <span className={isExp ? "text-amber-400 font-bold" : new Date(pkg.expirationDate) < new Date() ? "text-red-400" : "text-zinc-300"}>
                                    {new Date(pkg.expirationDate).toLocaleDateString("vi-VN")}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 italic">Không giới hạn</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500">Ngày mua:</span>
                              <div className="text-zinc-300 mt-0.5 font-medium">
                                {pkg.purchaseDate ? new Date(pkg.purchaseDate).toLocaleDateString("vi-VN") : "Chưa rõ"}
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500">Ngày kích hoạt:</span>
                              <div className="text-zinc-300 mt-0.5 font-medium">
                                {pkg.activationDate ? new Date(pkg.activationDate).toLocaleDateString("vi-VN") : "Chưa kích hoạt"}
                              </div>
                            </div>
                          </div>

                          {pkg.notes && (
                            <p className="text-xs text-zinc-400 italic bg-zinc-900/10 p-2 rounded-lg border border-zinc-850">
                              * {pkg.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-2 border-t border-zinc-800/40 pt-3">
                            <button
                              onClick={() => handleOpenEditPkg(pkg)}
                              className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Sửa gói
                            </button>
                            <button
                              onClick={() => handleDeletePkgSubmit(pkg.id)}
                              className="flex items-center gap-1 rounded-lg border border-zinc-800 hover:border-red-500/20 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xóa gói
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
                      Khách hàng này chưa có gói tập nào đăng ký.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ADD PACKAGE */}
            {pkgTab === "add" && (
              <form onSubmit={handleAddPkgSubmit} className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer transition-all text-xs font-semibold" onClick={() => setPkgTab("list")}>
                  <ArrowLeft className="h-4 w-4" /> Quay lại danh sách gói
                </div>

                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Mua / Đăng ký gói tập mới
                </h4>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tên gói tập *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Gói Pilates Reformer 20 Buổi"
                      value={pkgFormData.packageName}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, packageName: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng số buổi tập *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pkgFormData.totalSessions}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, totalSessions: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày mua</label>
                    <input
                      type="date"
                      value={pkgFormData.purchaseDate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, purchaseDate: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày kích hoạt</label>
                    <input
                      type="date"
                      value={pkgFormData.activationDate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, activationDate: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hạn sử dụng</label>
                    <input
                      type="date"
                      value={pkgFormData.expirationDate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, expirationDate: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="border-t border-zinc-800/60 sm:col-span-2 pt-4">
                    <h4 className="text-sm font-bold text-teal-400 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" /> Ghi nhận Thanh toán (Hóa đơn doanh thu tự động)
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Số tiền thanh toán (VND)</label>
                    <input
                      type="number"
                      min="0"
                      value={pkgFormData.paymentAmount}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, paymentAmount: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hình thức thanh toán</label>
                    <select
                      value={pkgFormData.paymentMethod}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, paymentMethod: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="BANK_TRANSFER" className="bg-zinc-900">Chuyển khoản (Bank Transfer)</option>
                      <option value="CASH" className="bg-zinc-900">Tiền mặt (Cash)</option>
                      <option value="CARD" className="bg-zinc-900">Quẹt thẻ (Card)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nhân viên bán gói</label>
                    <input
                      type="text"
                      placeholder="Tên nhân viên phụ trách tư vấn bán..."
                      value={pkgFormData.salesperson}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, salesperson: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ghi chú gói tập</label>
                    <textarea
                      placeholder="Ghi chú về gói tập này..."
                      value={pkgFormData.notes}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, notes: e.target.value })}
                      rows={2}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setPkgTab("list")}
                    className="rounded-xl border border-zinc-800 bg-transparent px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Lưu gói tập
                  </button>
                </div>
              </form>
            )}

            {/* TAB: EDIT PACKAGE */}
            {pkgTab === "edit" && selectedPackage && (
              <form onSubmit={handleEditPkgSubmit} className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer transition-all text-xs font-semibold" onClick={() => setPkgTab("list")}>
                  <ArrowLeft className="h-4 w-4" /> Quay lại danh sách gói
                </div>

                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Edit2 className="h-4 w-4" /> Chỉnh sửa thông tin gói tập
                </h4>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tên gói tập *</label>
                    <input
                      type="text"
                      required
                      value={pkgFormData.packageName}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, packageName: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng số buổi tập *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pkgFormData.totalSessions}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, totalSessions: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Số buổi đã sử dụng *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={pkgFormData.usedSessions}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, usedSessions: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trạng thái gói</label>
                    <select
                      value={pkgFormData.status}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, status: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="ACTIVE" className="bg-zinc-900">Hoạt động (Active)</option>
                      <option value="INACTIVE" className="bg-zinc-900">Ngưng hoạt động (Inactive)</option>
                      <option value="EXPIRED" className="bg-zinc-900">Đã hết hạn (Expired)</option>
                      <option value="OUT_OF_SESSIONS" className="bg-zinc-900">Đã hết buổi (Out of sessions)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày mua</label>
                    <input
                      type="date"
                      value={pkgFormData.purchaseDate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, purchaseDate: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày kích hoạt</label>
                    <input
                      type="date"
                      value={pkgFormData.activationDate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, activationDate: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hạn sử dụng</label>
                    <input
                      type="date"
                      value={pkgFormData.expirationDate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, expirationDate: e.target.value })}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ghi chú gói tập</label>
                    <textarea
                      value={pkgFormData.notes}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, notes: e.target.value })}
                      rows={2}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setPkgTab("list")}
                    className="rounded-xl border border-zinc-800 bg-transparent px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ================= DELETE CUSTOMER CONFIRM MODAL ================= */}
      {isDeleteModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xác nhận xóa khách hàng</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Bạn có chắc chắn muốn xóa khách hàng <strong className="text-white">{selectedCustomer.name}</strong> ({selectedCustomer.code})?
                Hành động này sẽ xóa vĩnh viễn dữ liệu khách hàng cùng tất cả lịch sử tập luyện, thanh toán liên quan và không thể khôi phục lại.
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
