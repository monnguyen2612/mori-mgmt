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

export async function cancelAttendanceLog(logId: string) {
  try {
    const log = await prisma.attendanceLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      throw new Error("Không tìm thấy ca điểm danh này.");
    }

    // Find the specific customer package linked to this log
    const pkg = await prisma.customerPackage.findUnique({
      where: { id: log.packageId },
    });

    if (pkg) {
      const nextUsed = Math.max(0, pkg.usedSessions - 1);
      const nextRemaining = pkg.totalSessions - nextUsed;

      // Automatically recover status back to ACTIVE if it was OUT_OF_SESSIONS
      let nextStatus = pkg.status;
      if (nextRemaining > 0 && pkg.status === "OUT_OF_SESSIONS") {
        nextStatus = "ACTIVE";
      }

      // Update package record
      await prisma.customerPackage.update({
        where: { id: pkg.id },
        data: {
          usedSessions: nextUsed,
          remainingSessions: nextRemaining,
          status: nextStatus,
        },
      });
    }

    // Delete the log
    await prisma.attendanceLog.delete({
      where: { id: logId },
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/dashboard/customers");
    safeRevalidatePath("/dashboard/checkin");
    safeRevalidatePath("/dashboard/logs");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to cancel attendance log:", error);
    return { success: false, error: error.message || "Không thể hủy bản ghi điểm danh." };
  }
}
