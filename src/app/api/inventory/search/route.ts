import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPharmacy } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const pharmacy = await getCurrentPharmacy();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!pharmacy) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query Synkk synced POS products
    const products = await prisma.product.findMany({
      where: {
        pharmacyId: pharmacy.id,
        ...(query
          ? {
              OR: [
                { itemName: { contains: query, mode: "insensitive" } },
                { brand: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      take: 20,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Inventory search error:", error);
    return NextResponse.json({ products: [] });
  }
}
