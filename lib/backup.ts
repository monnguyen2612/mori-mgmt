import fs from "fs";
import path from "path";

// Define source and target paths
const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const BACKUPS_DIR = path.join(process.cwd(), "backups");

export interface BackupResult {
  success: boolean;
  message: string;
  filename?: string;
  backupTime?: string;
}

/**
 * Perform database backup
 */
export async function performBackup(): Promise<BackupResult> {
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    const isCloudDb = dbUrl.startsWith("postgres:") || dbUrl.startsWith("postgresql:") || dbUrl.includes("supabase.co") || dbUrl.includes("supabase.in");

    if (isCloudDb) {
      return {
        success: false,
        message: "Hệ thống đang sử dụng cơ sở dữ liệu đám mây PostgreSQL (Supabase). Tính năng sao lưu cục bộ đã được tắt. Supabase tự động sao lưu dữ liệu của bạn hàng ngày.",
      };
    }

    // 1. Ensure source DB exists
    if (!fs.existsSync(DB_PATH)) {
      return {
        success: false,
        message: `Không tìm thấy file database nguồn tại: ${DB_PATH}`,
      };
    }

    // 2. Ensure backups directory exists
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    // 3. Create YYYY-MM-DD date tag
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}_${mm}_${dd}`;
    const filename = `dev_backup_${dateStr}.db`;
    const destPath = path.join(BACKUPS_DIR, filename);

    // 4. Check if already backed up today
    if (fs.existsSync(destPath)) {
      return {
        success: true,
        message: `Cơ sở dữ liệu hôm nay (${dateStr}) đã được sao lưu trước đó.`,
        filename,
      };
    }

    // 5. Copy DB file
    fs.copyFileSync(DB_PATH, destPath);

    // 6. Delete old backups if more than 7 (keep last 7 days)
    cleanOldBackups();

    return {
      success: true,
      message: `Sao lưu thành công database hôm nay (${dateStr}) vào thư mục backups/`,
      filename,
      backupTime: now.toLocaleTimeString("vi-VN"),
    };
  } catch (error: any) {
    console.error("Backup failed:", error);
    return {
      success: false,
      message: `Sao lưu thất bại: ${error.message || error}`,
    };
  }
}

/**
 * Housekeeping: Keep only the 7 most recent backups
 */
function cleanOldBackups() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;

    const files = fs.readdirSync(BACKUPS_DIR);
    const backupFiles = files
      .filter((file) => file.startsWith("dev_backup_") && file.endsWith(".db"))
      .map((file) => ({
        name: file,
        path: path.join(BACKUPS_DIR, file),
        mtime: fs.statSync(path.join(BACKUPS_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    // If more than 7, delete the older ones
    if (backupFiles.length > 7) {
      const toDelete = backupFiles.slice(7);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`Deleted old backup file: ${file.name}`);
      }
    }
  } catch (error) {
    console.error("Failed to clean old backups:", error);
  }
}

/**
 * Check and perform auto backup (runs once per calendar day)
 */
export async function checkAndAutoBackup(): Promise<BackupResult | null> {
  const dbUrl = process.env.DATABASE_URL || "";
  const isCloudDb = dbUrl.startsWith("postgres:") || dbUrl.startsWith("postgresql:") || dbUrl.includes("supabase.co") || dbUrl.includes("supabase.in");

  if (isCloudDb) {
    return null;
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}_${mm}_${dd}`;
  const filename = `dev_backup_${dateStr}.db`;
  const destPath = path.join(BACKUPS_DIR, filename);

  // If already backed up today, skip quietly
  if (fs.existsSync(destPath)) {
    return null;
  }

  // Otherwise, trigger backup
  return await performBackup();
}
