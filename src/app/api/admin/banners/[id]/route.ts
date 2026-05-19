import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { bannerSchema } from "@/lib/admin/validation";
import { deleteBanner, saveBanner } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const parsed = bannerSchema.safeParse({ ...(await request.json().catch(() => ({}))), id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid banner", issues: parsed.error.flatten() }, { status: 400 });
  await saveBanner(parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  await deleteBanner(id);
  return NextResponse.json({ ok: true });
}
