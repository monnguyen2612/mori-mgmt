import { prisma } from "@/lib/prisma";
import RevenuesClient from "@/components/RevenuesClient";

export const revalidate = 30;

export default async function RevenuesPage() {
  // Query all revenue records, including linked customer info
  const revenues = await prisma.revenue.findMany({
    take: 200,
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

  // Query all customers to let the user link a customer to a new invoice
  const customers = await prisma.customer.findMany({
    take: 200,
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Serialize dates correctly for Next.js Client Components
  const serializedRevenues = revenues.map((r) => ({
    ...r,
    date: new Date(r.date),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));

  return (
    <RevenuesClient
      initialRevenues={serializedRevenues as any}
      customers={customers}
    />
  );
}
