"use client";

import { useState, useTransition } from "react";
import { createSystemUser, deleteSystemUser, runManualBackup, clearAllData } from "@/app/dashboard/settings/actions";
import {
  Database,
  Download,
  FolderOpen,
  Plus,
  Trash2,
  UserPlus,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";

interface BackupFile {
  name: string;
  size: number;
  time: string;
}

interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: Date;
}

interface SettingsClientProps {
  backupFiles: BackupFile[];
  users: SystemUser[];
  currentUserRole: string;
}

export default function SettingsClient({
  backupFiles,
  users,
  currentUserRole,
}: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [backupMsg, setBackupMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // User Form
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "staff",
  });
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const isAdmin = currentUserRole === "admin";

  const handleBackupTrigger = async () => {
    setBackupMsg(null);
    startTransition(async () => {
      const res = await runManualBackup();
      if (res.success) {
        setBackupMsg({ type: "success", text: res.message });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBackupMsg({ type: "error", text: res.message });
      }
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);

    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
      setUserError("Vui lòng nhập đầy đủ các trường thông tin.");
      return;
    }

    startTransition(async () => {
      const res = await createSystemUser(formData);
      if (res.success) {
        setUserSuccess("Tạo tài khoản người dùng thành công!");
        setFormData({ name: "", username: "", password: "", role: "staff" });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setUserError(res.error || "Có lỗi xảy ra.");
      }
    });
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteSystemUser(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || "Không thể xóa người dùng.");
      }
    });
  };

  const handleClearAllData = async () => {
    if (!confirm("Xác nhận: bạn muốn xóa TẤT CẢ dữ liệu khách hàng, doanh thu và lịch sử? Hành động này không thể hoàn tác.")) return;
    setBackupMsg(null);
    startTransition(async () => {
      const res = await clearAllData();
      if (res.success) {
        setBackupMsg({ type: "success", text: res.message || "Đã xóa dữ liệu." });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setBackupMsg({ type: "error", text: res.error || "Xóa dữ liệu thất bại." });
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Cấu hình Cài đặt</h2>
        <p className="text-sm text-zinc-400">Sao lưu dữ liệu local, quản trị tài khoản nhân viên hệ thống</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left column: Backups (2/3 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Backup Action Panel */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-400" />
                Sao lưu dữ liệu (Database Backup)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Dữ liệu được lưu trữ local trên máy tính. Hãy thường xuyên sao lưu để tránh mất dữ liệu khi cài đặt lại máy hoặc lỗi ổ cứng.
              </p>
            </div>

            {backupMsg && (
              <div className={`flex items-start gap-2.5 rounded-xl border p-4 text-xs font-semibold ${
                backupMsg.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {backupMsg.type === "success" ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0" />}
                <span>{backupMsg.text}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleBackupTrigger}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs font-semibold text-zinc-950 shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                Tạo bản sao lưu cục bộ (Local Backup)
              </button>

              <button
                onClick={handleClearAllData}
                disabled={isPending || !isAdmin}
                title={!isAdmin ? "Chỉ admin mới có quyền" : "Xóa tất cả dữ liệu"}
                className="flex items-center gap-2 rounded-xl border border-red-500 bg-red-500/10 px-5 py-3 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Xóa toàn bộ dữ liệu
              </button>

              <a
                href="/api/backup?download=true"
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Tải file Database (.db) về máy
              </a>
            </div>

            <div className="rounded-2xl bg-zinc-950/40 p-4 border border-zinc-850 text-xs text-zinc-400 space-y-1.5 leading-relaxed">
              <p>💡 <strong>Gợi ý:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Bản sao lưu cục bộ được lưu tự động mỗi ngày vào thư mục: <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded font-mono">/backups</code> của dự án.</li>
                <li>Hệ thống tự động lưu giữ tối đa <strong>7 bản sao lưu gần nhất</strong> để tiết kiệm ổ đĩa.</li>
                <li>Nên sử dụng tính năng <strong>&quot;Tải file Database&quot;</strong> hàng tuần để cất trữ ở USB hoặc Google Drive cá nhân của studio để an toàn tuyệt đối.</li>
              </ul>
            </div>
          </div>

          {/* Backup list table */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                Bản sao lưu trong thư mục backups/
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Danh sách tệp tin sao lưu SQLite trong thư mục cục bộ của máy chủ</p>
            </div>

            <div className="overflow-hidden border border-zinc-800 rounded-2xl bg-zinc-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 text-zinc-400 font-bold uppercase border-b border-zinc-850">
                  <tr>
                    <th className="p-3 pl-4">Tên file sao lưu</th>
                    <th className="p-3">Dung lượng</th>
                    <th className="p-3 pr-4 text-right">Ngày giờ tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  {backupFiles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-zinc-500">
                        Chưa có file sao lưu nào được tạo.
                      </td>
                    </tr>
                  ) : (
                    backupFiles.map((file) => (
                      <tr key={file.name} className="hover:bg-zinc-900/30">
                        <td className="p-3 pl-4 font-mono text-zinc-300 font-semibold">{file.name}</td>
                        <td className="p-3 font-semibold">{formatSize(file.size)}</td>
                        <td className="p-3 pr-4 text-right font-medium text-zinc-400">{file.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: User management (1/3 col) */}
        <div className="space-y-6">
          {/* User management list */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                Tài khoản hệ thống
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Danh sách nhân viên, huấn luyện viên có quyền truy cập</p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-850"
                >
                  <div>
                    <div className="font-semibold text-white text-xs">{u.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">@{u.username}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 border ${
                      u.role === "admin" 
                        ? "bg-red-500/10 text-red-400 border-red-500/10" 
                        : u.role === "trainer"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/10"
                        : "bg-zinc-850 text-zinc-400 border-zinc-700/50"
                    }`}>
                      {u.role === "admin" ? "Admin" : u.role === "trainer" ? "HLV" : "Staff"}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add user form (admin only) */}
          {isAdmin ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-400" />
                  Thêm tài khoản mới
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Cấp quyền truy cập cho nhân viên/HLV mới</p>
              </div>

              {userError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-wider">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 px-3 text-white text-xs placeholder-zinc-650 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-wider">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    placeholder="vietname"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 px-3 text-white text-xs placeholder-zinc-655 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-wider">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 px-3 text-white text-xs placeholder-zinc-655 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-wider">Vai trò phân quyền</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 px-3 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="staff">Nhân viên Lễ tân (Staff)</option>
                    <option value="trainer">Huấn luyện viên (Trainer)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 font-bold text-zinc-950 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Thêm tài khoản
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm flex items-start gap-3">
              <Lock className="h-5 w-5 text-zinc-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-zinc-400 text-sm">Giới hạn quyền quản trị</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">
                  Chỉ có tài khoản Quản trị viên mới được phép cấp mới hoặc xóa tài khoản nhân viên. Vui lòng đăng nhập tài khoản Quản trị (admin) để tiếp tục thao tác này.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
