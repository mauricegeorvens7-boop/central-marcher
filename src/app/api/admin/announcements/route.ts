import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { announcementSchema } from "@/lib/admin/validation";
import { getAnnouncements, saveAnnouncement } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  return NextResponse.json({ announcements: getAnnouncements(true) });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const parsed = announcementSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid announcement", issues: parsed.error.flatten() }, { status: 400 });
  saveAnnouncement({ ...parsed.data, imageUrl: parsed.data.imageUrl || null });
  return NextResponse.json({ ok: true });
}
