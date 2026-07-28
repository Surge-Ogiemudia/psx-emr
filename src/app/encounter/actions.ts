"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";
import { PrismaClient } from "@prisma/client";

let fallbackPrisma: PrismaClient | null = null;

function getFallbackPrisma() {
  const uri = process.env.FALLBACK_MONGO_URI;
  if (!uri) return null;
  if (!fallbackPrisma) {
    fallbackPrisma = new PrismaClient({
      datasources: {
        db: { url: uri },
      },
    });
  }
  return fallbackPrisma;
}

export async function searchInventory(query: string) {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy || !query.trim()) return [];

  const resultsMap = new Map<string, { productId: string; name: string; defaultDose: string; qty: number; retailPrice: number }>();

  // 1. Primary search (EMR DB)
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { pharmacyId: pharmacy.id },
          { slug: pharmacy.subdomain },
        ],
        AND: [
          {
            OR: [
              { itemName: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: 20,
    });

    for (const p of products) {
      if (!p.itemName) continue;
      const name = `${p.itemName} ${p.brand ? `(${p.brand})` : ""} ${p.size || ""}`.trim();
      resultsMap.set(p.id, {
        productId: p.id,
        name,
        defaultDose: "",
        qty: p.quantity ?? p.quantityInStock ?? 0,
        retailPrice: p.amount ?? p.retailPrice ?? 0,
      });
    }
  } catch (e) {
    console.error("Primary inventory search error:", e);
  }

  // 2. Secondary fallback search (Main PSX DB / Synkk)
  const fallbackClient = getFallbackPrisma();
  if (fallbackClient) {
    try {
      const pName = pharmacy.name || "";
      // Generate candidate slugs (e.g. "Medlife Pharmacy" -> "medlife", "medlifepharma", "medlife pharmacy")
      const cleanName = pName.toLowerCase().replace(/pharmacy/gi, "").trim();
      const slugOptions = Array.from(new Set([
        pharmacy.subdomain,
        cleanName,
        `${cleanName}pharma`,
        pName.toLowerCase(),
        pName.toLowerCase().replace(/\s+/g, ""),
      ])).filter(Boolean);

      console.log(`[INVENTORY_DIAGNOSTIC] Pharmacy: "${pName}" | Subdomain: "${pharmacy.subdomain}" | Slugs:`, slugOptions);

      const slugFilters = slugOptions.flatMap((s) => [
        { slug: s },
        { slug: { contains: s, mode: "insensitive" as const } },
        { businessName: { contains: s, mode: "insensitive" as const } },
      ]);

      const fallbackProducts = await fallbackClient.product.findMany({
        where: {
          OR: slugFilters,
          AND: [
            {
              OR: [
                { itemName: { contains: query, mode: "insensitive" } },
                { brand: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 20,
      });

      console.log(`[INVENTORY_DIAGNOSTIC] Fallback search found ${fallbackProducts.length} items for query "${query}"`);

      for (const p of fallbackProducts) {
        if (!p.itemName || resultsMap.has(p.id)) continue;
        const name = `${p.itemName} ${p.brand ? `(${p.brand})` : ""} ${p.size || ""}`.trim();
        resultsMap.set(p.id, {
          productId: p.id,
          name,
          defaultDose: "",
          qty: p.quantity ?? p.quantityInStock ?? 0,
          retailPrice: p.amount ?? p.retailPrice ?? 0,
        });
      }
    } catch (e) {
      console.error("[INVENTORY_DIAGNOSTIC] Fallback inventory search error:", e);
    }
  } else {
    console.log("[INVENTORY_DIAGNOSTIC] FALLBACK_MONGO_URI is not set in environment.");
  }

  return Array.from(resultsMap.values());
}
