import { POST } from "./route";

jest.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));
const { prisma } = jest.requireMock("@/lib/prisma") as any;

import bcrypt from "bcryptjs";
jest.mock("bcryptjs");

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
  jest.clearAllMocks();
});

const mkReq = (body?: any) =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

it("400 on invalid json/body", async () => {
  const res = await POST(
    new Request("http://localhost/api/auth/login", { method: "POST" })
  );
  expect(res.status).toBe(400);
});

it("401 on invalid credentials (no user or bad password)", async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (bcrypt.compare as jest.Mock).mockResolvedValue(false);

  const res = await POST(mkReq({ email: "a@b.com", password: "x" }));
  expect(res.status).toBe(401);
  await expect(res.json()).resolves.toEqual(
    expect.objectContaining({
      error: expect.stringMatching(/Invalid credentials/i),
    })
  );
});

it("200 and sets cookie on success", async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 1,
    email: "a@b.com",
    hashedPassword: "$2a$10$something",
  });
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);

  const res = await POST(mkReq({ email: "a@b.com", password: "ok" }));
  expect(res.status).toBe(200);
  const setCookie = res.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  expect(setCookie).toMatch(/token=|__Host-token=/);
});
