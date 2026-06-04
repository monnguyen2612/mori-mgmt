import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { checkAndAutoBackup } from "@/lib/backup";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check and run daily backup in the background
  try {
    const backupResult = await checkAndAutoBackup();
    if (backupResult && backupResult.success) {
      console.log(`Auto Backup run successful: ${backupResult.message}`);
    }
  } catch (err) {
    console.error("Auto Backup background task failed:", err);
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 md:flex-row text-zinc-100 font-sans">
      <Sidebar 
        userName={session.user?.name || "Người dùng"} 
        userRole={(session.user as any).role || "staff"} 
      />
      <main className="flex-grow overflow-y-auto p-4 md:p-8 bg-zinc-950">
        <div className="mx-auto max-w-7xl space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
