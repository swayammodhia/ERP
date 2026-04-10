import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { automationWorkflowSchema } from "@/lib/validators";

export async function GET() {
  const workflows = await prisma.automationWorkflow.findMany({
    include: {
      runs: {
        take: 5,
        orderBy: { startedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = automationWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const workflow = await prisma.automationWorkflow.create({
    data: parsed.data,
  });

  return NextResponse.json(workflow, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    isActive?: boolean;
    name?: string;
    module?: string;
    configJson?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Workflow id is required" }, { status: 400 });
  }

  const workflow = await prisma.automationWorkflow.update({
    where: { id: body.id },
    data: {
      isActive: body.isActive,
      name: body.name,
      module: body.module,
      configJson: body.configJson,
      lastRunAt: body.isActive === false ? new Date() : undefined,
    },
  });

  return NextResponse.json(workflow);
}
