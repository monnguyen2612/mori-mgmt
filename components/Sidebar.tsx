"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserCheck,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Dumbbell,
  User as UserIcon,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  userRole: string;
}

export default function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Khách hàng", href: "/dashboard/customers", icon: Users },
    { name: "Doanh thu", href: "/dashboard/revenues", icon: DollarSign },
    { name: "Check-in", href: "/dashboard/checkin", icon: UserCheck },
    { name: "Lịch sử & Thống kê", href: "/dashboard/logs", icon: History },
    { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
  ];

  const getRoleBadge = (role: string) => {
    if (role === "admin") return "Quản trị";
    if (role === "trainer") return "HLV";
    return "Nhân viên";
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="font-bold text-white tracking-wider">Mori Pilates</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="hidden h-20 items-center gap-3 px-6 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">Mori Pilates</h1>
            <p className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Local Mgmt</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border-l-2 border-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-950/20">
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-950/40 p-3 border border-zinc-800/40 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/10">
                {getRoleBadge(userRole)}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/5 hover:border-red-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
