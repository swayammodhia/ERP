import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { accountSchema } from "@/lib/validators";

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: {
      journalLines: {
        take: 10,
        orderBy: { id: "desc" },
      },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = accountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.account.create({ data: parsed.data });
  return NextResponse.json(account, { status: 201 });
}
