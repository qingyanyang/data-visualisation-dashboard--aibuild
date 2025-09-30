import { GET, POST } from "./route";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));
const { prisma } = jest.requireMock("@/lib/prisma") as any;

jest.mock("@/lib/tokenCheck", () => ({
  verifyToken: jest.fn(),
}));
const { verifyToken } = jest.requireMock("@/lib/tokenCheck") as any;

const mkPostReq = (body?: any) =>
  new Request("http://localhost/api/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("/api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("returns products ordered by createdAt desc", async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 2, name: "B", sku: "SKU-2" },
        { id: 1, name: "A", sku: "SKU-1" },
      ]);

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.products).toHaveLength(2);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, sku: true },
      });
    });

    it("returns 500 on unexpected error", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      (prisma.product.findMany as jest.Mock).mockRejectedValue(
        new Error("boom")
      );

      const res = await GET();
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual(
        expect.objectContaining({ error: "Failed to fetch products" })
      );

      spy.mockRestore();
    });
  });

  describe("POST", () => {
    it("401 when unauthorized", async () => {
      (verifyToken as jest.Mock).mockResolvedValue(null);

      const res = await POST(mkPostReq({ name: "X", sku: "SKU-X" }));
      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    });

    it("201 and returns created product when authorized", async () => {
      (verifyToken as jest.Mock).mockResolvedValue({
        id: 123,
        email: "a@b.com",
      });
      (prisma.product.create as jest.Mock).mockResolvedValue({
        id: 10,
        name: "New",
        sku: "SKU-NEW",
      });

      const res = await POST(mkPostReq({ name: "New", sku: "SKU-NEW" }));
      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual({
        id: 10,
        name: "New",
        sku: "SKU-NEW",
      });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { name: "New", sku: "SKU-NEW" },
      });
    });

    it("500 on create error", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      (verifyToken as jest.Mock).mockResolvedValue({ id: 1, email: "x@y.com" });
      (prisma.product.create as jest.Mock).mockRejectedValue(
        new Error("insert fail")
      );

      const res = await POST(mkPostReq({ name: "New", sku: "SKU-NEW" }));
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual(
        expect.objectContaining({ error: "Failed to create product" })
      );

      spy.mockRestore();
    });
  });
});
