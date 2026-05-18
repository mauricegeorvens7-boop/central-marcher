import { NextResponse } from "next/server";
import { dbProductToProduct } from "@/lib/adapters";
import { getProducts } from "@/lib/db";

export function GET() {
  const products = getProducts().map(dbProductToProduct);
  return NextResponse.json({
    data: products,
    meta: {
      pagination: { page: 1, pageSize: products.length, total: products.length },
      performance: ["lazy images", "server rendering", "pagination-ready"],
    },
  });
}
