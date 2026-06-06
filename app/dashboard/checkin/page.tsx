import { prisma } from "@/lib/prisma";
import CheckInClient from "@/components/CheckInClient";

export const revalidate = 30;

export default async function CheckInPage() {
  // Query all customers to let the user check-in anyone in the system
  const customers = await prisma.customer.findMany({
    take: 200,
    include: {
      packages: {
        orderBy: {
          purchaseDate: "desc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Serialize dates correctly for Next.js Client Components
  const serializedCustomers = customers.map((c) => ({
    ...c,
    dob: c.dob ? new Date(c.dob) : null,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    packages: c.packages.map((pkg) => ({
      ...pkg,
      purchaseDate: new Date(pkg.purchaseDate),
      activationDate: pkg.activationDate ? new Date(pkg.activationDate) : null,
      expirationDate: pkg.expirationDate ? new Date(pkg.expirationDate) : null,
      createdAt: new Date(pkg.createdAt),
      updatedAt: new Date(pkg.updatedAt),
    })),
  }));

  return <CheckInClient customers={serializedCustomers as any} />;
}
