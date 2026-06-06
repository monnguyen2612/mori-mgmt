import { prisma } from "@/lib/prisma";
import CustomersClient from "@/components/CustomersClient";

export const revalidate = 30;

export default async function CustomersPage() {
  // Query all customers, sorted by creation date, including their packages
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
      createdAt: "desc",
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

  return <CustomersClient initialCustomers={serializedCustomers as any} />;
}
