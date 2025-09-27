import { PrismaClient } from "@/generated/prisma"; // since you set custom output
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    message: "Login successful",
  });
}
