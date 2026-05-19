import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { updateOrderStatus } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || "");
  const note = body.note ? String(body.note) : null;
  const order = await updateOrderStatus({ id, status, note });

  if (!order) return NextResponse.json({ error: "Commande introuvable ou statut invalide." }, { status: 400 });
  return NextResponse.json({ order });
}
