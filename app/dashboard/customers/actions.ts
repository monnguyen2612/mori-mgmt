"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to determine package status
function calculateStatus(remaining: number, expirationDate: Date | null, baseStatus: string): string {
  const now = new Date();
  if (remaining <= 0) {
    return "OUT_OF_SESSIONS";
  }
  if (expirationDate && new Date(expirationDate) < now) {
    return "EXPIRED";
  }
  return baseStatus === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

// Robust date parser to prevent Invalid Date crash in Prisma/SQLite
function parseDate(dateInput: any): Date | null {
  if (dateInput === null || dateInput === undefined) return null;
  const str = String(dateInput).trim();
  if (str === "") return null;
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

// Safe revalidatePath helper for testing/script context compatibility
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (e) {
    // Ignore in non-Next environments
  }
}

// Generate unique customer code like KH0006
async function generateCustomerCode(): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { createdAt: "desc" },
  });
  
  if (!lastCustomer) {
    return "KH0001";
  }

  // Try to parse number from code
  const match = lastCustomer.code.match(/^KH(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1]) + 1;
    return `KH${String(nextNum).padStart(4, "0")}`;
  }

  // Fallback
  return `KH${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export async function createCustomer(formData: any) {
  try {
    const code = formData.code?.trim() || (await generateCustomerCode());

    // Check if code already exists
    const existing = await prisma.customer.findUnique({
      where: { code },
    });
    if (existing) {
      throw new Error(`Mã khách hàng ${code} đã tồn tại trong hệ thống.`);
    }

    const dob = parseDate(formData.dob);
    
    // 1. Create Customer general record
    const customer = await prisma.customer.create({
      data: {
        code,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        dob,
        status: formData.status || "ACTIVE",
        notes: formData.notes?.trim() || null,
      },
    });

    // 2. Create Gói tập if provided
    if (formData.currentPackage && formData.currentPackage.trim() !== "") {
      const total = parseInt(formData.totalSessions) || 0;
      const used = parseInt(formData.usedSessions) || 0;
      const remaining = Math.max(0, total - used);

      const purchaseDate = parseDate(formData.purchaseDate) || new Date();
      const activationDate = parseDate(formData.activationDate);
      const expirationDate = parseDate(formData.expirationDate);

      const pkgStatus = calculateStatus(remaining, expirationDate, "ACTIVE");

      const pkg = await prisma.customerPackage.create({
        data: {
          customerId: customer.id,
          packageName: formData.currentPackage.trim(),
          totalSessions: total,
          usedSessions: used,
          remainingSessions: remaining,
          purchaseDate,
          activationDate,
          expirationDate,
          status: pkgStatus,
          notes: "Khởi tạo cùng hồ sơ khách hàng.",
        },
      });

      // 3. Create Revenue if paymentAmount > 0
      const paymentAmount = parseFloat(formData.paymentAmount) || 0;
      if (paymentAmount > 0) {
        await prisma.revenue.create({
          data: {
            customerId: customer.id,
            packageId: pkg.id,
            packageName: formData.currentPackage.trim(),
            totalSessions: total,
            amount: paymentAmount,
            pricePerSession: total > 0 ? paymentAmount / total : 0,
            paymentMethod: formData.paymentMethod || "BANK_TRANSFER",
            salesperson: formData.salesperson || "System",
            notes: "Tạo tự động khi thêm khách hàng.",
          },
        });
      }
    }

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create customer:", error);
    return { success: false, error: error.message || "Không thể thêm khách hàng." };
  }
}

export async function updateCustomer(id: string, formData: any) {
  try {
    const code = formData.code.trim();
    const dob = parseDate(formData.dob);

    // Check if code belongs to another customer
    const existing = await prisma.customer.findFirst({
      where: {
        code,
        NOT: { id },
      },
    });
    if (existing) {
      throw new Error(`Mã khách hàng ${code} đã được sử dụng bởi khách hàng khác.`);
    }

    await prisma.customer.update({
      where: { id },
      data: {
        code,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        dob,
        status: formData.status || "ACTIVE",
        notes: formData.notes?.trim() || null,
      },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update customer:", error);
    return { success: false, error: error.message || "Không thể cập nhật thông tin khách hàng." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    safeRevalidatePath("/dashboard/logs");
    safeRevalidatePath("/dashboard/revenues");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    return { success: false, error: error.message || "Không thể xóa khách hàng." };
  }
}

// --- NEW ACTIONS FOR MANAGING CUSTOMER PACKAGES SEPARATELY ---

export async function addCustomerPackage(formData: any) {
  try {
    const customerId = formData.customerId;
    const packageName = formData.packageName?.trim();
    const total = parseInt(formData.totalSessions) || 0;
    const amount = parseFloat(formData.paymentAmount) || 0;

    if (!customerId) {
      throw new Error("Không xác định được ID khách hàng.");
    }
    if (!packageName) {
      throw new Error("Vui lòng nhập tên gói tập.");
    }

    const purchaseDate = parseDate(formData.purchaseDate) || new Date();
    const activationDate = parseDate(formData.activationDate);
    const expirationDate = parseDate(formData.expirationDate);

    const remaining = total;
    const pkgStatus = calculateStatus(remaining, expirationDate, "ACTIVE");

    // 1. Create package
    const pkg = await prisma.customerPackage.create({
      data: {
        customerId,
        packageName,
        totalSessions: total,
        usedSessions: 0,
        remainingSessions: remaining,
        purchaseDate,
        activationDate,
        expirationDate,
        status: pkgStatus,
        notes: formData.notes?.trim() || null,
      },
    });

    // 2. Create Revenue record if paymentAmount > 0
    if (amount > 0) {
      await prisma.revenue.create({
        data: {
          customerId,
          packageId: pkg.id,
          packageName,
          totalSessions: total,
          amount,
          pricePerSession: total > 0 ? amount / total : 0,
          paymentMethod: formData.paymentMethod || "BANK_TRANSFER",
          salesperson: formData.salesperson || "System",
          notes: "Mua trực tiếp từ bảng quản lý gói tập.",
        },
      });
    }

    // 3. Mark customer status as ACTIVE
    await prisma.customer.update({
      where: { id: customerId },
      data: { status: "ACTIVE" },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    safeRevalidatePath("/dashboard/revenues");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add customer package:", error);
    return { success: false, error: error.message || "Không thể thêm gói tập." };
  }
}

export async function updateCustomerPackage(id: string, formData: any) {
  try {
    const packageName = formData.packageName?.trim();
    const total = parseInt(formData.totalSessions) || 0;
    const used = parseInt(formData.usedSessions) || 0;
    const remaining = Math.max(0, total - used);

    if (!packageName) {
      throw new Error("Vui lòng nhập tên gói tập.");
    }

    const purchaseDate = parseDate(formData.purchaseDate) || new Date();
    const activationDate = parseDate(formData.activationDate);
    const expirationDate = parseDate(formData.expirationDate);

    const pkgStatus = calculateStatus(remaining, expirationDate, formData.status || "ACTIVE");

    await prisma.customerPackage.update({
      where: { id },
      data: {
        packageName,
        totalSessions: total,
        usedSessions: used,
        remainingSessions: remaining,
        purchaseDate,
        activationDate,
        expirationDate,
        status: pkgStatus,
        notes: formData.notes?.trim() || null,
      },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update customer package:", error);
    return { success: false, error: error.message || "Không thể cập nhật gói tập." };
  }
}

export async function deleteCustomerPackage(id: string) {
  try {
    await prisma.customerPackage.delete({
      where: { id },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    safeRevalidatePath("/dashboard/logs");
    safeRevalidatePath("/dashboard/revenues");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete customer package:", error);
    return { success: false, error: error.message || "Không thể xóa gói tập." };
  }
}
