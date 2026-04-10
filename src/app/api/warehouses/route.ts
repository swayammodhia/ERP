import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { warehouseSchema } from "@/lib/validators";

export async function GET() {
  const warehouses = await prisma.warehouse.findMany({
    include: {
      stocks: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(warehouses);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = warehouseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const warehouse = await prisma.warehouse.create({
    data: parsed.data,
  });

  return NextResponse.json(warehouse, { status: 201 });
}
