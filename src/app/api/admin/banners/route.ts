import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { bannerSchema } from "@/lib/admin/validation";
import { getBanners, saveBanner } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  return NextResponse.json({ banners: await getBanners(true) });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const parsed = bannerSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid banner", issues: parsed.error.flatten() }, { status: 400 });
  await saveBanner(parsed.data);
  return NextResponse.json({ ok: true });
}
