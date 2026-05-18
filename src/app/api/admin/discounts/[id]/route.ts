import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { discountSchema } from "@/lib/admin/validation";
import { deleteDiscount, saveDiscount } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const parsed = discountSchema.safeParse({ ...(await request.json().catch(() => ({}))), id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid discount", issues: parsed.error.flatten() }, { status: 400 });
  saveDiscount({ ...parsed.data, enabled: parsed.data.enabled ? 1 : 0 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  deleteDiscount(id);
  return NextResponse.json({ ok: true });
}
