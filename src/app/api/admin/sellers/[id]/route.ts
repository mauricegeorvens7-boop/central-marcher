import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { sellerSchema } from "@/lib/admin/validation";
import { deleteSeller, saveSeller, updateSellerStatus } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const parsed = sellerSchema.safeParse({ ...(await request.json().catch(() => ({}))), id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid seller", issues: parsed.error.flatten() }, { status: 400 });
  const seller = await saveSeller({ ...parsed.data, password: parsed.data.password || undefined });
  return NextResponse.json({ seller });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const seller = await updateSellerStatus(id, body.status);
  if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  return NextResponse.json({ seller });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  await deleteSeller(id);
  return NextResponse.json({ ok: true });
}
