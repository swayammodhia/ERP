import { TransferStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { toMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { nextSequence } from "@/lib/sequence";
import { warehouseTransferSchema } from "@/lib/validators";

export async function GET() {
  const transfers = await prisma.warehouseTransfer.findMany({
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(transfers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = warehouseTransferSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.fromWarehouseId === payload.toWarehouseId) {
    return NextResponse.json({ error: "Source and destination warehouses must differ" }, { status: 400 });
  }

  try {
    const transfer = await prisma.$transaction(async (tx) => {
      if (payload.status === TransferStatus.COMPLETED) {
        for (const item of payload.items) {
          const sourceStock = await tx.warehouseStock.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: payload.fromWarehouseId,
                productId: item.productId,
              },
            },
          });

          if (!sourceStock || sourceStock.quantity < item.quantity) {
            throw new Error("Insufficient warehouse stock for transfer");
          }
        }
      }

      const transferNumber = await nextSequence(tx, "warehouseTransfer");

      const created = await tx.warehouseTransfer.create({
        data: {
          transferNumber,
          fromWarehouseId: payload.fromWarehouseId,
          toWarehouseId: payload.toWarehouseId,
          status: payload.status,
          note: payload.note,
          items: {
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: toMinorUnits(item.unitCost),
            })),
          },
        },
      });

      if (payload.status === TransferStatus.COMPLETED) {
        for (const item of payload.items) {
          await tx.warehouseStock.update({
            where: {
              warehouseId_productId: {
                warehouseId: payload.fromWarehouseId,
                productId: item.productId,
              },
            },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });

          await tx.warehouseStock.upsert({
            where: {
              warehouseId_productId: {
                warehouseId: payload.toWarehouseId,
                productId: item.productId,
              },
            },
            update: {
              quantity: {
                increment: item.quantity,
              },
            },
            create: {
              warehouseId: payload.toWarehouseId,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }
      }

      return tx.warehouseTransfer.findUnique({
        where: { id: created.id },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create transfer" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    status?: TransferStatus;
    note?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Transfer id is required" }, { status: 400 });
  }

  const transfer = await prisma.warehouseTransfer.update({
    where: { id: body.id },
    data: {
      status: body.status,
      note: body.note,
    },
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(transfer);
}
