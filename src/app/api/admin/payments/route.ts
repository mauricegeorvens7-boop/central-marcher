import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { getPaymentSettings, getPaymentTransactions, savePaymentSettings } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  return NextResponse.json({ settings: getPaymentSettings(), transactions: getPaymentTransactions() });
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ settings: savePaymentSettings(body) });
}
