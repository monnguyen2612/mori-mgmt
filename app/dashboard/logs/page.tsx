import { prisma } from "@/lib/prisma";
import LogsClient from "@/components/LogsClient";

export const revalidate = 30;

export default async function LogsPage() {
  // Query all attendance logs
  const logs = await prisma.attendanceLog.findMany({
    include: {
      customer: {
        select: {
          code: true,
          name: true,
          phone: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Extract unique trainers for the filter dropdown
  const uniqueTrainers = Array.from(
    new Set(logs.map((l) => l.trainer).filter(Boolean))
  );

  // Serialize dates correctly for Next.js Client Components
  const serializedLogs = logs.map((l) => ({
    ...l,
    date: new Date(l.date),
    createdAt: new Date(l.createdAt),
    updatedAt: new Date(l.updatedAt),
  }));

  return <LogsClient initialLogs={serializedLogs as any} trainers={uniqueTrainers} />;
}
