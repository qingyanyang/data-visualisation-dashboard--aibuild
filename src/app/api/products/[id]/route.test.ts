import { PUT, DELETE } from "./route";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
const { prisma } = jest.requireMock("@/lib/prisma") as any;

jest.mock("@/lib/tokenCheck", () => ({
  verifyToken: jest.fn(),
}));
const { verifyToken } = jest.requireMock("@/lib/tokenCheck") as any;

// helpers
const mkPutReq = (body?: any) =>
  new Request("http://localhost/api/products/1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const mkCtx = (id = "1") => ({ params: Promise.resolve({ id }) });

describe("/api/products/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks?.();
  });

  describe("PUT", () => {
    it("401 when unauthorized", async () => {
      (verifyToken as jest.Mock).mockResolvedValue(null);

      const res = await PUT(
        mkPutReq({ name: "X", sku: "SKU-X" }) as any,
        mkCtx()
      );
      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    });

    it("200 and returns updated product when authorized", async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ id: 9, email: "a@b.com" });
      (prisma.product.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: "Updated",
        sku: "SKU-UP",
      });

      const res = await PUT(
        mkPutReq({ name: "Updated", sku: "SKU-UP" }) as any,
        mkCtx("1")
      );

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        id: 1,
        name: "Updated",
        sku: "SKU-UP",
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "Updated", sku: "SKU-UP" },
      });
    });

    it("500 on update error", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      (verifyToken as jest.Mock).mockResolvedValue({ id: 9, email: "a@b.com" });
      (prisma.product.update as jest.Mock).mockRejectedValue(new Error("boom"));

      const res = await PUT(mkPutReq({ name: "X", sku: "Y" }) as any, mkCtx());
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual(
        expect.objectContaining({ error: "Failed to update product" })
      );

      spy.mockRestore();
    });
  });

  describe("DELETE", () => {
    it("401 when unauthorized", async () => {
      (verifyToken as jest.Mock).mockResolvedValue(null);

      const res = await DELETE(
        new Request("http://localhost/api/products/1") as any,
        mkCtx()
      );
      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    });

    it("200 and returns message on success when authorized", async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ id: 9, email: "a@b.com" });
      (prisma.product.delete as jest.Mock).mockResolvedValue({});

      const res = await DELETE(
        new Request("http://localhost/api/products/1") as any,
        mkCtx("1")
      );
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ message: "Product deleted" });
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("500 on delete error", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      (verifyToken as jest.Mock).mockResolvedValue({ id: 9, email: "a@b.com" });
      (prisma.product.delete as jest.Mock).mockRejectedValue(new Error("boom"));

      const res = await DELETE(
        new Request("http://localhost/api/products/1") as any,
        mkCtx()
      );
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual(
        expect.objectContaining({ error: "Failed to delete product" })
      );

      spy.mockRestore();
    });
  });
});
