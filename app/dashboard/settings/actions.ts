"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { performBackup } from "@/lib/backup";
import { revalidatePath } from "next/cache";

// Safe revalidatePath helper for testing/script context compatibility
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (e) {
    // Ignore in non-Next environments
  }
}
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function createSystemUser(formData: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Vui lòng đăng nhập.");
    }
    
    const role = (session.user as any).role;
    if (role !== "admin") {
      throw new Error("Chỉ tài khoản Quản trị viên mới có quyền thêm người dùng hệ thống.");
    }

    const username = formData.username.trim().toLowerCase();
    const password = formData.password.trim();
    const name = formData.name.trim();
    const userRole = formData.role || "staff";

    if (!username || !password || !name) {
      throw new Error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
    }

    const existing = await prisma.user.findUnique({
      where: { username },
    });
    if (existing) {
      throw new Error(`Tên đăng nhập "${username}" đã tồn tại.`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: userRole,
      },
    });

    safeRevalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return { success: false, error: error.message || "Không thể tạo tài khoản người dùng." };
  }
}

export async function deleteSystemUser(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Vui lòng đăng nhập.");
    }

    const role = (session.user as any).role;
    const currentUserId = (session.user as any).id;

    if (role !== "admin") {
      throw new Error("Chỉ tài khoản Quản trị viên mới có quyền xóa người dùng.");
    }

    if (currentUserId === id) {
      throw new Error("Bạn không thể tự xóa tài khoản đang sử dụng để đăng nhập.");
    }

    await prisma.user.delete({
      where: { id },
    });

    safeRevalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return { success: false, error: error.message || "Không thể xóa tài khoản." };
  }
}

export async function runManualBackup() {
  try {
    const res = await performBackup();
    safeRevalidatePath("/dashboard/settings");
    return res;
  } catch (error: any) {
    console.error("Manual backup trigger failed:", error);
    return { success: false, message: error.message || "Lỗi hệ thống sao lưu." };
  }
}

export async function clearAllData() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Vui lòng đăng nhập.");
    }

    const role = (session.user as any).role;
    if (role !== "admin") {
      throw new Error("Chỉ tài khoản Quản trị viên mới có quyền xóa toàn bộ dữ liệu.");
    }

    // Delete dependent data first
    await prisma.attendanceLog.deleteMany({});
    await prisma.revenue.deleteMany({});
    await prisma.customerPackage.deleteMany({});
    await prisma.customer.deleteMany({});

    // Keep system users intact to allow re-login and re-seed if necessary

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/revenues");
    safeRevalidatePath("/dashboard/logs");
    return { success: true, message: "Đã xóa tất cả dữ liệu khách hàng, doanh thu và lịch sử điểm danh." };
  } catch (error: any) {
    console.error("Failed to clear all data:", error);
    return { success: false, error: error.message || "Không thể xóa dữ liệu." };
  }
}
