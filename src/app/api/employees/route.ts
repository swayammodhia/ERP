import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validators";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = employeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: parsed.data,
  });

  return NextResponse.json(employee, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
    role?: string;
    department?: string | null;
    name?: string;
    email?: string | null;
    phone?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Employee id is required" }, { status: 400 });
  }

  const employee = await prisma.employee.update({
    where: { id: body.id },
    data: {
      status: body.status,
      role: body.role,
      department: body.department,
      name: body.name,
      email: body.email,
      phone: body.phone,
    },
  });

  return NextResponse.json(employee);
}
