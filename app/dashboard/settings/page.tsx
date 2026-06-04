import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/SettingsClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

export const revalidate = 0; // Disable page caching for real-time local updates

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const currentUserRole = (session?.user as any)?.role || "staff";

  // Query all system users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Read backups directory
  const backupsDir = path.join(process.cwd(), "backups");
  let backupFiles: { name: string; size: number; time: string }[] = [];

  if (fs.existsSync(backupsDir)) {
    try {
      const files = fs.readdirSync(backupsDir);
      backupFiles = files
        .filter((file) => file.startsWith("dev_backup_") && file.endsWith(".db"))
        .map((file) => {
          const filePath = path.join(backupsDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            time: stats.mtime.toLocaleString("vi-VN"),
          };
        })
        .sort((a, b) => b.name.localeCompare(a.name)); // newest first
    } catch (err) {
      console.error("Failed to read backups directory:", err);
    }
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const isCloudDb = dbUrl.startsWith("postgres:") || dbUrl.startsWith("postgresql:") || dbUrl.includes("supabase.co") || dbUrl.includes("supabase.in");

  return (
    <SettingsClient
      backupFiles={backupFiles}
      users={users as any}
      currentUserRole={currentUserRole}
      isCloudDb={isCloudDb}
    />
  );
}
