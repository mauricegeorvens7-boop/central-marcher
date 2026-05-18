import { NextRequest, NextResponse } from "next/server";
import { requireSellerApi } from "@/lib/admin/auth";
import { productSchema } from "@/lib/admin/validation";
import { deleteProduct, getProductById, saveProduct } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSellerApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const product = getProductById(id);
  if (!product || product.sellerId !== guard.seller.id) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const parsed = productSchema.safeParse({
    ...body,
    id,
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
  return NextResponse.json({ product: saveProduct({ ...parsed.data, sellerId: guard.seller.id }) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSellerApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const product = getProductById(id);
  if (!product || product.sellerId !== guard.seller.id) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
