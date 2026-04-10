import { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { toMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { nextSequence } from "@/lib/sequence";
import { posCheckoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = posCheckoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const productIds = payload.items.map((item) => item.productId);

      const inventories = await tx.inventory.findMany({
        where: { productId: { in: productIds } },
        include: { product: true },
      });

      const inventoryMap = new Map(inventories.map((entry) => [entry.productId, entry]));

      let subtotal = 0;
      let taxAmount = 0;

      const normalizedItems = payload.items.map((item) => {
        const inventory = inventoryMap.get(item.productId);

        if (!inventory) {
          throw new Error(`Product inventory missing for ${item.productId}`);
        }

        if (inventory.onHandQty < item.quantity) {
          throw new Error(`Insufficient stock for ${inventory.product.name}`);
        }

        const unitPrice = Number(inventory.product.sellingPrice);
        const lineSubtotal = unitPrice * item.quantity;
        const lineTax = Math.round((lineSubtotal * Number(inventory.product.taxRate)) / 100);
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        taxAmount += lineTax;

        return {
          item,
          inventory,
          unitPrice,
          lineTax,
          lineTotal,
        };
      });

      const totalAmount = subtotal + taxAmount;
      const paidAmount = toMinorUnits(payload.paidAmount);
      const balanceAmount = totalAmount - paidAmount;

      if (paidAmount > totalAmount) {
        throw new Error("Paid amount cannot be greater than invoice total");
      }

      const billNumber = await nextSequence(tx, "posBill");

      const bill = await tx.posBill.create({
        data: {
          billNumber,
          customerName: payload.customerName,
          subtotal,
          taxAmount,
          totalAmount,
          paidAmount,
          changeAmount: 0,
          paymentMethod: payload.paymentMethod,
          items: {
            create: normalizedItems.map((entry) => ({
              productId: entry.inventory.product.id,
              productName: entry.inventory.product.name,
              sku: entry.inventory.product.sku,
              quantity: entry.item.quantity,
              unitPrice: entry.unitPrice,
              lineTax: entry.lineTax,
              lineTotal: entry.lineTotal,
            })),
          },
        },
      });

      await Promise.all(
        normalizedItems.map((entry) =>
          tx.inventory.update({
            where: { id: entry.inventory.id },
            data: {
              onHandQty: {
                decrement: entry.item.quantity,
              },
            },
          }),
        ),
      );

      await Promise.all(
        normalizedItems.map((entry) =>
          tx.stockMovement.create({
            data: {
              inventoryId: entry.inventory.id,
              type: "OUT",
              quantity: entry.item.quantity,
              note: "POS Sale",
              reference: bill.id,
            },
          }),
        ),
      );

      const invoiceNumber = await nextSequence(tx, "invoice");

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          billId: bill.id,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
          totalAmount,
          paidAmount,
          balanceAmount,
          status:
            paidAmount === 0
              ? InvoiceStatus.PENDING
              : balanceAmount === 0
                ? InvoiceStatus.PAID
                : InvoiceStatus.PARTIAL,
        },
      });

      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: paidAmount,
            method: payload.paymentMethod,
            note: "POS checkout payment",
          },
        });
      }

      return tx.posBill.findUnique({
        where: { id: bill.id },
        include: {
          items: true,
          invoice: {
            include: { payments: true },
          },
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to complete checkout",
      },
      { status: 400 },
    );
  }
}
