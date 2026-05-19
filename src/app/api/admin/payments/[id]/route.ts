import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { updatePaymentTransaction } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!["paid", "rejected"].includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const transaction = await updatePaymentTransaction({ id, status: body.status, adminNote: body.adminNote || null });
  if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  return NextResponse.json({ transaction });
}
