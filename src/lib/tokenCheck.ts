import { jwtVerify } from "jose";
import { z } from "zod";

export interface TokenPayload {
  userId: number;
  email: string;
}

const tokenSchema = z.object({
  userId: z.number(),
  email: z.string().email(),
});

export async function verifyToken(req: Request): Promise<TokenPayload | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const parsed = tokenSchema.parse(payload);
    return parsed;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}
