"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";

export async function searchInventory(query: string) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) return [];

  const products = await prisma.product.findMany({
    where: {
      pharmacyId: pharmacy.id,
      itemName: {
        contains: query,
        mode: "insensitive",
      },
    },
    take: 15,
  });

  return products.map((p) => ({
    name: `${p.itemName} (${p.brand}) ${p.size}`,
    defaultDose: "1 daily", // default instruction fallback
    qty: p.quantityInStock,
  }));
}
