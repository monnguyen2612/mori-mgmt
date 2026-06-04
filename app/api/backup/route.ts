import { NextResponse } from "next/server";
import { performBackup } from "@/lib/backup";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download");

    const dbUrl = process.env.DATABASE_URL || "";
    const isCloudDb = dbUrl.startsWith("postgres:") || dbUrl.startsWith("postgresql:") || dbUrl.includes("supabase.co") || dbUrl.includes("supabase.in");

    if (isCloudDb) {
      if (download === "true") {
        return NextResponse.json({ error: "Không thể tải database SQLite khi đang sử dụng PostgreSQL/Supabase." }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        message: "Hệ thống đang sử dụng cơ sở dữ liệu đám mây PostgreSQL (Supabase). Tính năng sao lưu cục bộ đã được tắt. Supabase tự động sao lưu dữ liệu của bạn hàng ngày."
      });
    }

    if (download === "true") {
      const dbPath = path.join(process.cwd(), "prisma", "dev.db");
      if (!fs.existsSync(dbPath)) {
        return NextResponse.json({ error: "Không tìm thấy database file" }, { status: 404 });
      }
      
      const dbBuffer = fs.readFileSync(dbPath);
      return new NextResponse(dbBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="dev.db"',
        },
      });
    }

    // Default: Perform local backup
    const result = await performBackup();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi hệ thống: " + (error.message || error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const result = await performBackup();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi hệ thống: " + (error.message || error) },
      { status: 500 }
    );
  }
}
