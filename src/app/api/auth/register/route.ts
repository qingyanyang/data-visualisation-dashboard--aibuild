import { PrismaClient } from "@/generated/prisma"; // since you set custom output
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, hashedPassword },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
