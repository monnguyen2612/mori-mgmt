import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  } else {
    redirect("/dashboard");
  }
}
