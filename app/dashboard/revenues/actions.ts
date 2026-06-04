"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Safe revalidatePath helper for testing/script context compatibility
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (e) {
    // Ignore in non-Next environments
  }
}

// Robust date parser to prevent Invalid Date crash in Prisma/SQLite
function parseDate(dateInput: any): Date | null {
  if (dateInput === null || dateInput === undefined) return null;
  const str = String(dateInput).trim();
  if (str === "") return null;
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

export async function createRevenue(formData: any) {
  try {
    const customerId = formData.customerId;
    const packageName = formData.packageName?.trim();
    const totalSessions = parseInt(formData.totalSessions) || 0;
    const amount = parseFloat(formData.amount) || 0;
    const paymentMethod = formData.paymentMethod || "BANK_TRANSFER";
    const salesperson = formData.salesperson?.trim() || "System";
    const notes = formData.notes?.trim() || null;
    const date = parseDate(formData.date) || new Date();

    if (!customerId) {
      throw new Error("Vui lòng chọn khách hàng.");
    }
    if (!packageName) {
      throw new Error("Vui lòng nhập tên gói tập.");
    }
    if (amount <= 0) {
      throw new Error("Số tiền thanh toán phải lớn hơn 0.");
    }

    // 1. Create the CustomerPackage record first
    const pkg = await prisma.customerPackage.create({
      data: {
        customerId,
        packageName,
        totalSessions,
        usedSessions: 0,
        remainingSessions: totalSessions,
        purchaseDate: date,
        activationDate: date, // Default activation date is purchase date
        status: "ACTIVE",
        notes: notes ? `Tạo kèm doanh thu: ${notes}` : "Khởi tạo cùng doanh thu.",
      },
    });

    const pricePerSession = totalSessions > 0 ? amount / totalSessions : 0;

    // 2. Create the Revenue record linked to the package
    await prisma.revenue.create({
      data: {
        customerId,
        packageId: pkg.id,
        packageName,
        totalSessions,
        amount,
        pricePerSession,
        paymentMethod,
        salesperson,
        notes,
        date,
      },
    });

    // 3. Keep customer status as ACTIVE
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        status: "ACTIVE",
      },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    safeRevalidatePath("/dashboard/revenues");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create revenue:", error);
    return { success: false, error: error.message || "Không thể thêm hóa đơn doanh thu." };
  }
}

export async function deleteRevenue(id: string) {
  try {
    await prisma.revenue.delete({
      where: { id },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/revenues");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete revenue:", error);
    return { success: false, error: error.message || "Không thể xóa hóa đơn." };
  }
}
