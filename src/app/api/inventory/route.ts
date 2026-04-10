import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { stockAdjustmentSchema } from "@/lib/validators";

export async function GET() {
  const stock = await prisma.inventory.findMany({
    include: {
      product: true,
      movements: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(stock);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = stockAdjustmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, quantityDelta, note } = parsed.data;

  const updatedInventory = await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({ where: { productId } });

    if (!inventory) {
      throw new Error("Inventory record not found");
    }

    const nextQty = inventory.onHandQty + quantityDelta;

    if (nextQty < 0) {
      throw new Error("Insufficient stock for this adjustment");
    }

    const updated = await tx.inventory.update({
      where: { id: inventory.id },
      data: { onHandQty: nextQty },
      include: { product: true },
    });

    await tx.stockMovement.create({
      data: {
        inventoryId: inventory.id,
        type: quantityDelta > 0 ? "IN" : "OUT",
        quantity: Math.abs(quantityDelta),
        note,
        reference: updated.product.sku,
      },
    });

    return updated;
  });

  return NextResponse.json(updatedInventory);
}
