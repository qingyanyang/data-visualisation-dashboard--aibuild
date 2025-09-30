import z from "zod";
import { POST, GET } from "./route";

// --- Mocks ---
jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    procurement: { upsert: jest.fn() },
    sale: { upsert: jest.fn() },
    inventorySnapshot: { upsert: jest.fn() },
    uploadHistory: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(),
  },
}));
const { prisma } = jest.requireMock("@/lib/prisma") as any;

jest.mock("@/lib/tokenCheck", () => ({ verifyToken: jest.fn() }));
const { verifyToken } = jest.requireMock("@/lib/tokenCheck") as any;

// Make currency parsing permissive for tests
jest.mock("@/lib/utils", () => {
  return { currencyToNumber: z.coerce.number() };
});

// Mock xlsx to return our rows directly (avoid real parsing)
jest.mock("xlsx", () => ({
  read: jest
    .fn()
    .mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } }),
  utils: { sheet_to_json: jest.fn() },
}));
const XLSX = jest.requireMock("xlsx");

// --- Helpers ---
const makeFile = (name = "data.xlsx") => {
  return new File([Buffer.from("dummy")], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};
const reqWithFormData = (fd: FormData) =>
  ({ formData: async () => fd } as unknown as Request);
const url = (qs: string) => new Request(`http://localhost/api/upload?${qs}`);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/uploads", () => {
  it("401 when unauthorized", async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);

    // returns early; no need to provide real formData
    const res = await POST({} as Request);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("400 when no file is provided", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      userId: 7,
      email: "a@b.com",
    });
    const fd = new FormData(); // no "file"
    const res = await POST(reqWithFormData(fd));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "No file uploaded" });
  });

  it("200 on full success; creates products, upserts rows, records history", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      userId: 7,
      email: "a@b.com",
    });

    // Mock parsed Excel rows (all valid)
    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
      {
        "Product Name": "Shampoo",
        Date: "2025-09-01",
        "Opening Inventory": 10,
        "Procurement Qty": 5,
        "Procurement Price": 3.5,
        "Sales Qty": 2,
        "Sales Price": 9.0,
      },
    ]);

    // No existing products first -> createMany
    (prisma.product.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // existingProducts (by sku)
      .mockResolvedValueOnce([{ id: 1, name: "Shampoo", sku: "SHAMPOO" }]); // refetch with ids

    (prisma.$transaction as jest.Mock).mockResolvedValue([]);
    (prisma.uploadHistory.create as jest.Mock).mockResolvedValue({});

    const fd = new FormData();
    fd.append("file", makeFile());

    const res = await POST(reqWithFormData(fd));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ message: "Upload successful", processed: 1 });

    // created missing products
    expect(prisma.product.createMany).toHaveBeenCalledWith({
      data: [{ name: "Shampoo", sku: "SHAMPOO" }],
    });

    // row upserts got scheduled
    expect(prisma.procurement.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.sale.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.inventorySnapshot.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalled();

    // history recorded
    expect(prisma.uploadHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileName: "data.xlsx",
          rowCount: 1,
          status: "success",
          userId: 7,
        }),
      })
    );
  });

  it("200 on partial success (some invalid rows)", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      userId: 7,
      email: "a@b.com",
    });

    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
      // valid
      {
        "Product Name": "Soap",
        Date: "2025-09-02",
        "Opening Inventory": 5,
        "Procurement Qty": 1,
        "Procurement Price": 2.0,
        "Sales Qty": 1,
        "Sales Price": 3.0,
      },
      // invalid (missing Product Name)
      {
        Date: "2025-09-02",
        "Procurement Qty": 1,
        "Procurement Price": 2.0,
      },
    ]);

    (prisma.product.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // before createMany
      .mockResolvedValueOnce([{ id: 2, name: "Soap", sku: "SOAP" }]);
    (prisma.product.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    (prisma.$transaction as jest.Mock).mockResolvedValue([]);
    (prisma.uploadHistory.create as jest.Mock).mockResolvedValue({});

    const fd = new FormData();
    fd.append("file", makeFile());

    const res = await POST(reqWithFormData(fd));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ message: "Upload successful", processed: 1 });

    // Only the valid row generates upserts
    expect(prisma.procurement.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.sale.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.inventorySnapshot.upsert).toHaveBeenCalledTimes(1);
  });

  it("500 on unexpected error", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    (verifyToken as jest.Mock).mockResolvedValue({
      userId: 7,
      email: "a@b.com",
    });

    // Throw during product lookup (for example)
    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
      {
        "Product Name": "X",
        Date: "2025-09-01",
        "Opening Inventory": 1,
        "Procurement Qty": 1,
        "Procurement Price": 1.5,
        "Sales Qty": 0,
        "Sales Price": 0,
      },
    ]);
    (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error("boom"));

    const fd = new FormData();
    fd.append("file", makeFile());

    const res = await POST(reqWithFormData(fd));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({ error: "Upload failed" })
    );

    spy.mockRestore();
  });
});

describe("GET /api/uploads (history)", () => {
  it("returns paginated history", async () => {
    (prisma.uploadHistory.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        fileName: "data.xlsx",
        rowCount: 3,
        status: "success",
        uploadedAt: new Date("2025-09-30"),
        user: { email: "a@b.com" },
      },
    ]);
    (prisma.uploadHistory.count as jest.Mock).mockResolvedValue(25);

    const res = await GET(url("page=2"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.total).toBe(25);
    expect(body.totalPages).toBe(3);
    expect(body.data).toHaveLength(1);

    expect(prisma.uploadHistory.findMany).toHaveBeenCalledWith({
      include: { user: { select: { email: true } } },
      orderBy: { uploadedAt: "desc" },
      skip: 10,
      take: 10,
    });
    expect(prisma.uploadHistory.count).toHaveBeenCalled();
  });
});
