import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { discountSchema } from "@/lib/admin/validation";
import { getDiscounts, saveDiscount } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  return NextResponse.json({ discounts: await getDiscounts(true) });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const parsed = discountSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid discount", issues: parsed.error.flatten() }, { status: 400 });
  await saveDiscount({ ...parsed.data, enabled: parsed.data.enabled ? 1 : 0 });
  return NextResponse.json({ ok: true });
}
