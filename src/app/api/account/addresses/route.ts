import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin/auth";
import { deleteUserAddress, saveUserAddress } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const id = await saveUserAddress(user.id, {
    id: body.id ? String(body.id) : undefined,
    label: String(body.label || "Maison"),
    name: String(body.name || user.name),
    line1: String(body.line1 || ""),
    city: String(body.city || ""),
    province: String(body.province || ""),
    postalCode: String(body.postalCode || ""),
    phone: String(body.phone || user.phone || ""),
    isDefault: Boolean(body.isDefault),
  });
  return NextResponse.json({ id });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Adresse manquante." }, { status: 400 });
  await deleteUserAddress(user.id, id);
  return NextResponse.json({ ok: true });
}
