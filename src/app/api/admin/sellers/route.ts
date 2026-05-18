import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { sellerSchema } from "@/lib/admin/validation";
import { getSellers, saveSeller } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  return NextResponse.json({ sellers: getSellers() });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const parsed = sellerSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid seller", issues: parsed.error.flatten() }, { status: 400 });
  const seller = await saveSeller({ ...parsed.data, password: parsed.data.password || undefined });
  return NextResponse.json({ seller });
}
