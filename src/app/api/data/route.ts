import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function utcDateFromYMD(ymd: string) {
  return new Date(ymd + "T00:00:00.000Z");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productIds = searchParams.get("productIds");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const metrics = searchParams.get("metrics");

    if (!productIds || !from || !to || !metrics) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // Parse as UTC
    const fromUTC = utcDateFromYMD(from);
    const toUTC = utcDateFromYMD(to);
    const toEndOfDayUTC = new Date(toUTC.getTime() + (MS_PER_DAY - 1)); // 23:59:59.999Z

    const productIdArray = productIds.split(",").map((id) => Number(id));
    const metricArray = metrics.split(","); // ["procurement","sales","endInventory"]

    const days =
      Math.floor((toUTC.getTime() - fromUTC.getTime()) / MS_PER_DAY) + 1;
    if (days < 1) {
      return NextResponse.json(
        { error: "Invalid date range: 'to' must be after or equal to 'from'" },
        { status: 400 }
      );
    }
    if (days > 7) {
      return NextResponse.json(
        { error: "Max 7 days allowed" },
        { status: 400 }
      );
    }

    // fetch products that actually exist
    const products = await prisma.product.findMany({
      where: { id: { in: productIdArray } },
      select: { id: true, name: true },
    });

    // Build inclusive list of YYYY-MM-DD using UTC
    const dateStrings: string[] = [];
    for (let t = fromUTC.getTime(); t <= toUTC.getTime(); t += MS_PER_DAY) {
      dateStrings.push(new Date(t).toISOString().slice(0, 10));
    }

    // Prefetch selected metrics only (UTC range)
    const [procurements, sales, snapshots] = await Promise.all([
      metricArray.includes("procurement")
        ? prisma.procurement.findMany({
            where: {
              productId: { in: productIdArray },
              date: { gte: fromUTC, lte: toEndOfDayUTC },
            },
            select: { productId: true, date: true, qty: true, unitPrice: true },
          })
        : [],
      metricArray.includes("sales")
        ? prisma.sale.findMany({
            where: {
              productId: { in: productIdArray },
              date: { gte: fromUTC, lte: toEndOfDayUTC },
            },
            select: { productId: true, date: true, qty: true, unitPrice: true },
          })
        : [],
      metricArray.includes("endInventory")
        ? prisma.inventorySnapshot.findMany({
            where: {
              productId: { in: productIdArray },
              date: { gte: fromUTC, lte: toEndOfDayUTC },
            },
            select: { productId: true, date: true, closingQty: true },
          })
        : [],
    ]);

    type DayData = {
      date: string;
      procurementQty?: number;
      procurementUnitPrice?: number;
      salesQty?: number;
      salesUnitPrice?: number;
      endInventoryQty?: number;
    };

    // Pre-fill zeros for requested metrics
    const grouped: Record<number, Record<string, DayData>> = {};
    for (const p of products) {
      grouped[p.id] = {};
      for (const ds of dateStrings) {
        const base: DayData = { date: ds };
        if (metricArray.includes("procurement")) {
          base.procurementQty = 0;
          base.procurementUnitPrice = 0;
        }
        if (metricArray.includes("sales")) {
          base.salesQty = 0;
          base.salesUnitPrice = 0;
        }
        if (metricArray.includes("endInventory")) {
          base.endInventoryQty = 0;
        }
        grouped[p.id][ds] = base;
      }
    }

    // Merge real rows — normalize to UTC YYYY-MM-DD
    if (metricArray.includes("procurement")) {
      for (const r of procurements) {
        const ds = r.date.toISOString().slice(0, 10);
        if (grouped[r.productId]?.[ds]) {
          grouped[r.productId][ds].procurementQty = Number(r.qty);
          grouped[r.productId][ds].procurementUnitPrice = Number(r.unitPrice);
        }
      }
    }

    if (metricArray.includes("sales")) {
      for (const r of sales) {
        const ds = r.date.toISOString().slice(0, 10);
        if (grouped[r.productId]?.[ds]) {
          grouped[r.productId][ds].salesQty = Number(r.qty);
          grouped[r.productId][ds].salesUnitPrice = Number(r.unitPrice);
        }
      }
    }

    if (metricArray.includes("endInventory")) {
      for (const r of snapshots) {
        const ds = r.date.toISOString().slice(0, 10);
        if (grouped[r.productId]?.[ds]) {
          grouped[r.productId][ds].endInventoryQty = Number(r.closingQty);
        }
      }
    }

    const result = products.map((p) => ({
      productId: p.id,
      productName: p.name,
      data: dateStrings.map((ds) => grouped[p.id][ds]),
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
