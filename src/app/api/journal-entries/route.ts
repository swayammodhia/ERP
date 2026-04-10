import { NextResponse } from "next/server";

import { toMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { nextSequence } from "@/lib/sequence";
import { journalEntrySchema } from "@/lib/validators";

export async function GET() {
  const entries = await prisma.journalEntry.findMany({
    include: {
      lines: {
        include: {
          account: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = journalEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const debitTotal = payload.lines.reduce((sum, line) => sum + toMinorUnits(line.debitAmount), 0);
  const creditTotal = payload.lines.reduce((sum, line) => sum + toMinorUnits(line.creditAmount), 0);

  if (debitTotal === 0 || creditTotal === 0 || debitTotal !== creditTotal) {
    return NextResponse.json(
      { error: "Journal entry must be balanced with matching debit and credit totals" },
      { status: 400 },
    );
  }

  const entryNumber = await nextSequence(prisma, "journalEntry");

  const entry = await prisma.journalEntry.create({
    data: {
      entryNumber,
      reference: payload.reference,
      memo: payload.memo,
      lines: {
        create: payload.lines.map((line) => ({
          accountId: line.accountId,
          debitAmount: toMinorUnits(line.debitAmount),
          creditAmount: toMinorUnits(line.creditAmount),
          note: line.note,
        })),
      },
    },
    include: {
      lines: {
        include: {
          account: true,
        },
      },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
