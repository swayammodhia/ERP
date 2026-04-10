import { NextResponse } from "next/server";

import { toMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      inventory: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        sku: payload.sku,
        name: payload.name,
        description: payload.description,
        sellingPrice: toMinorUnits(payload.sellingPrice),
        costPrice: toMinorUnits(payload.costPrice),
        taxRate: payload.taxRate,
        reorderLevel: payload.reorderLevel,
      },
    });

    const inventory = await tx.inventory.create({
      data: {
        productId: created.id,
        onHandQty: payload.openingStock,
      },
    });

    if (payload.openingStock > 0) {
      await tx.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "IN",
          quantity: payload.openingStock,
          note: "Opening stock",
          reference: created.sku,
        },
      });
    }

    return tx.product.findUnique({
      where: { id: created.id },
      include: { inventory: true },
    });
  });

  return NextResponse.json(product, { status: 201 });
}
