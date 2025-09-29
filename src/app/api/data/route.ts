import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productIds = searchParams.get("productIds");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!productIds || !from || !to) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const productIdArray = productIds.split(",").map((id) => Number(id));

    // validate max 30 days
    const days =
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 30) {
      return NextResponse.json(
        { error: "Max 30 days allowed" },
        { status: 400 }
      );
    }

    // fetch products
    const products = await prisma.product.findMany({
      where: { id: { in: productIdArray } },
      select: { id: true, name: true },
    });

    // fetch procurements & sales in bulk
    const procurements = await prisma.procurement.findMany({
      where: {
        productId: { in: productIdArray },
        date: { gte: fromDate, lte: toDate },
      },
    });
    const sales = await prisma.sale.findMany({
      where: {
        productId: { in: productIdArray },
        date: { gte: fromDate, lte: toDate },
      },
    });

    // group by product + date
    const grouped: Record<number, Record<string, any>> = {};

    for (const p of procurements) {
      const date = p.date.toISOString().slice(0, 10);
      if (!grouped[p.productId]) grouped[p.productId] = {};
      if (!grouped[p.productId][date])
        grouped[p.productId][date] = {
          date,
          procurementQty: 0,
          procurementUnitPrice: 0,
          salesQty: 0,
          salesUnitPrice: 0,
          endInventoryQty: 0,
        };

      grouped[p.productId][date].procurementQty += Number(p.qty);
      grouped[p.productId][date].procurementUnitPrice = Number(p.unitPrice);
      grouped[p.productId][date].endInventoryQty += Number(p.qty);
    }

    for (const s of sales) {
      const date = s.date.toISOString().slice(0, 10);
      if (!grouped[s.productId]) grouped[s.productId] = {};
      if (!grouped[s.productId][date])
        grouped[s.productId][date] = {
          date,
          procurementQty: 0,
          procurementUnitPrice: 0,
          salesQty: 0,
          salesUnitPrice: 0,
          endInventoryQty: 0,
        };

      grouped[s.productId][date].salesQty += Number(s.qty);
      grouped[s.productId][date].salesUnitPrice = Number(s.unitPrice);
      grouped[s.productId][date].endInventoryQty -= Number(s.qty);
    }

    const result = products.map((p) => ({
      productId: p.id,
      productName: p.name,
      data: Object.values(grouped[p.id] || {}).sort((a: any, b: any) =>
        a.date.localeCompare(b.date)
      ),
    }));

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
