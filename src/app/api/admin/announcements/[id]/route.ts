import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { announcementSchema } from "@/lib/admin/validation";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const parsed = announcementSchema.safeParse({ ...(await request.json().catch(() => ({}))), id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid announcement", issues: parsed.error.flatten() }, { status: 400 });
  await saveAnnouncement({ ...parsed.data, imageUrl: parsed.data.imageUrl || null });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  await deleteAnnouncement(id);
  return NextResponse.json({ ok: true });
}
