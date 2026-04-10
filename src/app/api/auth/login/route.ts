import { NextResponse } from "next/server";

import { ADMIN_AUTH_COOKIE, isValidAdminLogin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string; password?: string };

  if (!body.userId || !body.password) {
    return NextResponse.json({ error: "ID and password are required" }, { status: 400 });
  }

  if (!isValidAdminLogin(body.userId, body.password)) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
