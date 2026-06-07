import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CheckInClient from "@/components/CheckInClient";

export const revalidate = 60;

async function CheckInData() {
  const customers = await prisma.customer.findMany({
    take: 200,
    include: {
      packages: {
        orderBy: { purchaseDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

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

function CheckInSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-zinc-800" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-zinc-800" />
            <div className="h-3 w-1/2 rounded bg-zinc-800" />
            <div className="h-10 w-full rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CheckInPage() {
  return (
    <Suspense fallback={<CheckInSkeleton />}>
      <CheckInData />
    </Suspense>
  );
}
