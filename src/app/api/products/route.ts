import { NextResponse } from "next/server";
import { dbProductToProduct } from "@/lib/adapters";
import { getProducts } from "@/lib/db";

export async function GET() {
  const products = (await getProducts()).map(dbProductToProduct);
  return NextResponse.json({
    data: products,
    meta: {
      pagination: { page: 1, pageSize: products.length, total: products.length },
      performance: ["lazy images", "server rendering", "pagination-ready"],
    },
  });
}
