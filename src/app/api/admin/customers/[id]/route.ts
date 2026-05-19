import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { updateCustomerStatus } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || "");
  if (!["active", "suspended", "banned"].includes(status)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  const user = await updateCustomerStatus(id, status as "active" | "suspended" | "banned");
  if (!user) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  return NextResponse.json({ user });
}
