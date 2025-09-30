import { GET } from "./route";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: jest.fn() },
    procurement: { findMany: jest.fn() },
    sale: { findMany: jest.fn() },
    inventorySnapshot: { findMany: jest.fn() },
  },
}));
const { prisma } = jest.requireMock("@/lib/prisma") as any;

const mk = (qs: string) => new Request(`http://localhost/api/chart?${qs}`);

describe("GET /api/chart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("400 when missing params", async () => {
    const res = await GET(mk("productIds=1&from=2025-09-01&to=2025-09-01"));
    expect(res.status).toBe(400);
  });

  it("400 when 'to' is before 'from'", async () => {
    const res = await GET(
      mk("productIds=1&from=2025-09-03&to=2025-09-01&metrics=procurement")
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/after or equal/i),
      })
    );
  });

  it("accepts 7 days inclusive, rejects 8", async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: "P1" },
    ]);
    (prisma.procurement.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.sale.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.inventorySnapshot.findMany as jest.Mock).mockResolvedValue([]);

    // 7 days OK
    let res = await GET(
      mk("productIds=1&from=2025-09-01&to=2025-09-07&metrics=procurement")
    );
    expect(res.status).toBe(200);

    // 8 days -> 400
    res = await GET(
      mk("productIds=1&from=2025-09-01&to=2025-09-08&metrics=procurement")
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: expect.stringMatching(/Max 7 days/) })
    );
  });

  it("zero-fills days and merges rows for all metrics", async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: "Shampoo" },
    ]);
    (prisma.procurement.findMany as jest.Mock).mockResolvedValue([
      { productId: 1, date: new Date("2025-09-02"), qty: 5, unitPrice: 3.5 },
    ]);
    (prisma.sale.findMany as jest.Mock).mockResolvedValue([
      { productId: 1, date: new Date("2025-09-03"), qty: 2, unitPrice: 9.0 },
    ]);
    (prisma.inventorySnapshot.findMany as jest.Mock).mockResolvedValue([
      { productId: 1, date: new Date("2025-09-01"), closingQty: 10 },
      { productId: 1, date: new Date("2025-09-02"), closingQty: 12 },
      { productId: 1, date: new Date("2025-09-03"), closingQty: 11 },
    ]);

    const res = await GET(
      mk(
        "productIds=1&from=2025-09-01&to=2025-09-03&metrics=procurement,sales,endInventory"
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const data = body.products[0].data;

    expect(data.map((d: any) => d.date)).toEqual([
      "2025-09-01",
      "2025-09-02",
      "2025-09-03",
    ]);

    expect(data[0]).toMatchObject({
      procurementQty: 0,
      procurementUnitPrice: 0,
      salesQty: 0,
      salesUnitPrice: 0,
      endInventoryQty: 10,
    });
    expect(data[1]).toMatchObject({
      procurementQty: 5,
      procurementUnitPrice: 3.5,
      salesQty: 0,
      salesUnitPrice: 0,
      endInventoryQty: 12,
    });
    expect(data[2]).toMatchObject({
      procurementQty: 0,
      procurementUnitPrice: 0,
      salesQty: 2,
      salesUnitPrice: 9.0,
      endInventoryQty: 11,
    });
  });

  it("respects metric subset and zero-fills only those fields", async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: "P1" },
    ]);
    (prisma.procurement.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(
      mk("productIds=1&from=2025-09-01&to=2025-09-02&metrics=procurement")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const d0 = body.products[0].data[0];

    expect(d0).toEqual({
      date: "2025-09-01",
      procurementQty: 0,
      procurementUnitPrice: 0,
    });
    expect("salesQty" in d0).toBe(false);
    expect("endInventoryQty" in d0).toBe(false);
  });

  it("returns only existing products", async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: 2, name: "OnlyExisting" },
    ]);

    const res = await GET(
      mk("productIds=1,2&from=2025-09-01&to=2025-09-01&metrics=procurement")
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.products).toHaveLength(1);
    expect(body.products[0].productId).toBe(2);
  });

  it("500 on unexpected error", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error("boom"));

    const res = await GET(
      mk("productIds=1&from=2025-09-01&to=2025-09-01&metrics=procurement")
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Failed to fetch data" })
    );

    spy.mockRestore();
  });
});
