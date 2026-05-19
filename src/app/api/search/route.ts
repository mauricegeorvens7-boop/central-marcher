import { NextRequest, NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { dbProductToProduct } from "@/lib/adapters";
import { getProducts } from "@/lib/db";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const products = (await getProducts()).map(dbProductToProduct);
  const productSuggestions = products
    .filter((product) => [product.name, product.brand, product.category, product.sku].some((value) => value.toLowerCase().includes(query)))
    .slice(0, 6);
  const categorySuggestions = categories.filter((category) => category.toLowerCase().includes(query)).slice(0, 6);

  return NextResponse.json({
    query,
    products: productSuggestions,
    categories: categorySuggestions,
    history: ["oled laptop", "open box earbuds", "pickup tv"],
    filters: ["price", "brand", "rating", "availability", "condition", "seller", "freeShipping", "pickup"],
  });
}
