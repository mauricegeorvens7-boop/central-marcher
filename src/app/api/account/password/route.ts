import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin/auth";
import { changeUserPassword } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword || "");
  const nextPassword = String(body.nextPassword || "");
  if (nextPassword.length < 8) return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  const result = await changeUserPassword(user.id, currentPassword, nextPassword);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
