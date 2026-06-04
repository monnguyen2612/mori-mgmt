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

export async function checkInCustomer(customerId: string, packageId: string, trainer: string, notes: string) {
  try {
    if (!packageId) {
      throw new Error("Vui lòng chọn gói tập để check-in.");
    }
    if (!trainer || !trainer.trim()) {
      throw new Error("Vui lòng nhập hoặc chọn tên Huấn luyện viên (HLV).");
    }

    // 1. Fetch package and customer details
    const pkg = await prisma.customerPackage.findUnique({
      where: { id: packageId },
      include: { customer: true },
    });

    if (!pkg) {
      throw new Error("Không tìm thấy gói tập của khách hàng.");
    }

    if (pkg.customer.status === "INACTIVE" || pkg.status === "INACTIVE") {
      throw new Error("Gói tập hoặc học viên đang ở trạng thái ngưng hoạt động.");
    }

    if (pkg.remainingSessions <= 0) {
      throw new Error("Gói tập được chọn đã hết buổi tập (Còn lại = 0).");
    }

    // Check expiration
    if (pkg.expirationDate && new Date(pkg.expirationDate) < new Date()) {
      throw new Error("Gói tập được chọn đã hết hạn sử dụng.");
    }

    // 2. Fetch cost per session from linked revenue or fallback
    const latestRevenue = await prisma.revenue.findFirst({
      where: { packageId: pkg.id },
      orderBy: { date: "desc" },
    });

    let costPerSession = latestRevenue?.pricePerSession || 0;
    if (costPerSession === 0) {
      // Try to find any other client purchase of the same package name in the studio to estimate price
      const matchingPackageRevenue = await prisma.revenue.findFirst({
        where: { packageName: pkg.packageName },
        orderBy: { date: "desc" },
      });
      if (matchingPackageRevenue) {
        costPerSession = matchingPackageRevenue.pricePerSession;
      } else {
        // Default fallback (e.g. 500,000 VND per session) if package price is unknown
        costPerSession = 500000;
      }
    }

    const nextUsed = pkg.usedSessions + 1;
    const nextRemaining = Math.max(0, pkg.totalSessions - nextUsed);

    // Update package status to OUT_OF_SESSIONS if no sessions remain
    let nextStatus = pkg.status;
    if (nextRemaining <= 0) {
      nextStatus = "OUT_OF_SESSIONS";
    }

    // Check activation date: if usedSessions is 0 and package has no activation date, set it to today!
    const activationDate = (pkg.usedSessions === 0 && !pkg.activationDate) 
      ? new Date() 
      : pkg.activationDate;

    // 3. Create the attendance log
    await prisma.attendanceLog.create({
      data: {
        customerId,
        packageId: pkg.id,
        packageName: pkg.packageName,
        trainer: trainer.trim(),
        costPerSession,
        notes: notes?.trim() || null,
        checkInStatus: "CHECKED_IN",
      },
    });

    // 4. Update customer package numbers
    await prisma.customerPackage.update({
      where: { id: pkg.id },
      data: {
        usedSessions: nextUsed,
        remainingSessions: nextRemaining,
        status: nextStatus,
        activationDate,
      },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    safeRevalidatePath("/dashboard/logs");
    return { success: true };
  } catch (error: any) {
    console.error("Check-in action failed:", error);
    return { success: false, error: error.message || "Không thể hoàn thành check-in." };
  }
}
