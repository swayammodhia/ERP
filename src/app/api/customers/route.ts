import { NextResponse } from "next/server";

import { toMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      bills: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = customerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const customer = await prisma.customer.create({
    data: {
      code: payload.code,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      creditLimit: toMinorUnits(payload.creditLimit),
    },
  });

  return NextResponse.json(customer, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    isActive?: boolean;
    creditLimit?: number;
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Customer id is required" }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id: body.id },
    data: {
      isActive: body.isActive,
      creditLimit: typeof body.creditLimit === "number" ? toMinorUnits(body.creditLimit) : undefined,
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
    },
  });

  return NextResponse.json(customer);
}
