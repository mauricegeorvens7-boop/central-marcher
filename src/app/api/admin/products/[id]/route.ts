import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { productSchema } from "@/lib/admin/validation";
import { deleteProduct, saveProduct } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const parsed = productSchema.safeParse({ ...(await request.json().catch(() => ({}))), id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ product: saveProduct(parsed.data) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
