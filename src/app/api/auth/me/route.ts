import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokenCheck";

export async function GET(req: Request) {
  const parsed = await verifyToken(req);

  if (!parsed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    userId: parsed.userId,
    email: parsed.email,
  });
}
