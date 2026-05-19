import { NextRequest, NextResponse } from "next/server";
import { requireSellerApi } from "@/lib/admin/auth";
import { productSchema } from "@/lib/admin/validation";
import { getProducts, saveProduct } from "@/lib/db";

export async function GET() {
  const guard = await requireSellerApi();
  if (guard.response) return guard.response;
  return NextResponse.json({ products: await getProducts({ includeHidden: true, sellerId: guard.seller.id }) });
}

export async function POST(request: NextRequest) {
  const guard = await requireSellerApi();
  if (guard.response) return guard.response;
  const body = await request.json().catch(() => ({}));
  const parsed = productSchema.safeParse({
    ...body,
    benefitsAndUsage: body.benefitsAndUsage || "",
    seoTitle: body.seoTitle || "",
    seoDescription: body.seoDescription || "",
    keywords: body.keywords || "",
    variantsJson: body.variantsJson || "[]",
    shippingJson: body.shippingJson || null,
    protectionJson: body.protectionJson || null,
    marketplaceJson: JSON.stringify({ enabled: false, soldBy: guard.seller.storeName, sellers: [] }),
    specsJson: body.specsJson || "{}",
    discountJson: body.discountJson || null,
    color: body.color || "",
    size: body.size || "",
    model: body.model || "",
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ product: await saveProduct({ ...parsed.data, sellerId: guard.seller.id }) });
}
