import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/tokenCheck";
import { currencyToNumber } from "@/lib/utils";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as z from "zod";

const ExcelRowSchema = z.object({
  ID: z.string().optional(),
  "Product Name": z.string().nonempty("Product Name is required"),
  Date: z.coerce.date(),
  "Opening Inventory": z.coerce.number().optional(),
  "Procurement Qty": z.coerce.number().optional(),
  "Procurement Price": currencyToNumber,
  "Sales Qty": z.coerce.number().optional(),
  "Sales Price": currencyToNumber,
});

type ExcelRowValidated = z.infer<typeof ExcelRowSchema>;

export async function POST(req: Request) {
  const user = await verifyToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read Excel
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // 1. Parse & validate
    const parsedRows: ExcelRowValidated[] = [];
    const errors: any[] = [];

    for (const [i, rawRow] of rows.entries()) {
      const parsed = ExcelRowSchema.safeParse(rawRow);
      if (!parsed.success) {
        errors.push({ row: i + 2, errors: parsed.error.flatten().fieldErrors });
        continue;
      }
      parsedRows.push(parsed.data);
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { message: "No valid rows found", errors },
        { status: 400 }
      );
    }

    // 2. Resolve products (bulk ensure)
    const names = [...new Set(parsedRows.map((r) => r["Product Name"].trim()))];
    const skus = names.map((n) => n.replace(/\s+/g, "").toUpperCase());

    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } },
    });

    const existingSkus = new Set(existingProducts.map((p) => p.sku));
    const toCreate = skus
      .filter((sku) => !existingSkus.has(sku))
      .map((sku) => ({
        name:
          names.find((n) => n.replace(/\s+/g, "").toUpperCase() === sku) ?? sku,
        sku,
      }));

    if (toCreate.length > 0) {
      await prisma.product.createMany({ data: toCreate });
    }

    // Re-fetch all products with IDs
    const products = await prisma.product.findMany({
      where: { sku: { in: skus } },
    });
    const productMap = new Map(products.map((p) => [p.sku!, p.id]));

    // 3. Prepare DB operations
    const ops = [];
    for (const row of parsedRows) {
      const productName = row["Product Name"].trim();
      const sku = productName.replace(/\s+/g, "").toUpperCase();
      const productId = productMap.get(sku)!;
      const date = row.Date;

      if (row["Procurement Qty"] && row["Procurement Price"]) {
        ops.push(
          prisma.procurement.upsert({
            where: { productId_date: { productId, date } },
            update: {
              qty: row["Procurement Qty"],
              unitPrice: row["Procurement Price"],
            },
            create: {
              productId,
              date,
              qty: row["Procurement Qty"],
              unitPrice: row["Procurement Price"],
            },
          })
        );
      }

      if (row["Sales Qty"] && row["Sales Price"]) {
        ops.push(
          prisma.sale.upsert({
            where: { productId_date: { productId, date } },
            update: {
              qty: row["Sales Qty"],
              unitPrice: row["Sales Price"],
            },
            create: {
              productId,
              date,
              qty: row["Sales Qty"],
              unitPrice: row["Sales Price"],
            },
          })
        );
      }

      if (row["Opening Inventory"]) {
        const endInventoryQty =
          Number(row["Opening Inventory"]) +
          (Number(row["Procurement Qty"]) ?? 0) -
          (Number(row["Sales Qty"]) ?? 0);

        ops.push(
          prisma.inventorySnapshot.upsert({
            where: { productId_date: { productId, date } },
            update: {
              openingQty: row["Opening Inventory"],
              closingQty: endInventoryQty,
            },
            create: {
              productId,
              date,
              openingQty: row["Opening Inventory"],
              closingQty: endInventoryQty,
            },
          })
        );
      }
    }

    // 4. Run DB operations in one transaction
    await prisma.$transaction(ops);

    // 5. Record upload history
    await prisma.uploadHistory.create({
      data: {
        fileName: file.name,
        rowCount: parsedRows.length,
        status: errors.length > 0 ? "partial" : "success",
        errors: errors.length > 0 ? errors : undefined,
        userId: user.userId,
      },
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          message: "Upload finished with some skipped rows",
          processed: parsedRows.length,
          errors,
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      message: "Upload successful",
      processed: parsedRows.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const [data, total] = await Promise.all([
    prisma.uploadHistory.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { uploadedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.uploadHistory.count(),
  ]);

  return NextResponse.json({
    data,
    page,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
