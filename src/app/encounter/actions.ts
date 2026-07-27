"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";

export async function searchInventory(query: string) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy || !query.trim()) return [];

  const products = await prisma.product.findMany({
    where: {
      pharmacyId: pharmacy.id,
      OR: [
        { itemName: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
  });

  return products.map((p) => ({
    productId: p.id,
    name: `${p.itemName} ${p.brand ? `(${p.brand})` : ""} ${p.size || ""}`.trim(),
    defaultDose: "", // Prescriber will fill dosage instructions
    qty: p.quantityInStock,
    retailPrice: p.retailPrice,
  }));
}
