import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [
    customerCount,
    warehouseCount,
    transferCount,
    employeeCount,
    accountCount,
    workflowCount,
    openInvoices,
    unpaidAmount,
  ] = await Promise.all([
    prisma.customer.count({ where: { isActive: true } }),
    prisma.warehouse.count({ where: { isActive: true } }),
    prisma.warehouseTransfer.count(),
    prisma.employee.count({ where: { status: { in: ["ACTIVE", "ON_LEAVE"] } } }),
    prisma.account.count({ where: { isActive: true } }),
    prisma.automationWorkflow.count({ where: { isActive: true } }),
    prisma.invoice.count({ where: { status: { in: ["PENDING", "PARTIAL"] } } }),
    prisma.invoice.aggregate({
      _sum: { balanceAmount: true },
      where: { status: { in: ["PENDING", "PARTIAL"] } },
    }),
  ]);

  return NextResponse.json({
    customerCount,
    warehouseCount,
    transferCount,
    employeeCount,
    accountCount,
    workflowCount,
    openInvoices,
    outstandingReceivables: Number(unpaidAmount._sum.balanceAmount ?? 0),
  });
}
