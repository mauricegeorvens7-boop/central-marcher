import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { getPaymentSettings, getPaymentTransactions, savePaymentSettings } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const [settings, transactions] = await Promise.all([getPaymentSettings(), getPaymentTransactions()]);
  return NextResponse.json({ settings, transactions });
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ settings: await savePaymentSettings(body) });
}
