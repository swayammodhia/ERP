import { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { toMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validators";

export async function GET() {
  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        include: {
          bill: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { invoiceId, amount, method, transactionRef, note } = parsed.data;
  const amountMinor = toMinorUnits(amount);

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const remaining = Number(invoice.balanceAmount);

      if (amountMinor > remaining) {
        throw new Error("Payment amount exceeds pending balance");
      }

      const created = await tx.payment.create({
        data: {
          invoiceId,
          amount: amountMinor,
          method,
          transactionRef,
          note,
        },
      });

      const nextPaidAmount = Number(invoice.paidAmount) + amountMinor;
      const nextBalance = Number(invoice.totalAmount) - nextPaidAmount;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: nextPaidAmount,
          balanceAmount: nextBalance,
          status: nextBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
        },
      });

      return created;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record payment" },
      { status: 400 },
    );
  }
}
