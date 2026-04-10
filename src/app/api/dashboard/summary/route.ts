import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [productCount, lowStock, todaySales, pendingInvoices] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.inventory.findMany({
      where: {
        product: {
          reorderLevel: {
            gt: 0,
          },
        },
      },
      include: {
        product: true,
      },
    }),
    prisma.posBill.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.invoice.count({
      where: {
        status: {
          in: ["PENDING", "PARTIAL"],
        },
      },
    }),
  ]);

  const lowStockCount = lowStock.filter(
    (entry) => entry.onHandQty <= entry.product.reorderLevel,
  ).length;

  return NextResponse.json({
    productCount,
    lowStockCount,
    todaySales: Number(todaySales._sum.totalAmount ?? 0),
    pendingInvoices,
  });
}
