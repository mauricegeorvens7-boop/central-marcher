import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin/auth";
import { updateUserProfile } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const updated = await updateUserProfile(user.id, {
    firstName: String(body.firstName || ""),
    lastName: String(body.lastName || ""),
    gender: String(body.gender || ""),
    birthDate: String(body.birthDate || ""),
    phone: String(body.phone || ""),
    email: String(body.email || user.email),
    language: String(body.language || "fr"),
    profilePhoto: String(body.profilePhoto || ""),
    coverPhoto: String(body.coverPhoto || ""),
  });
  return NextResponse.json({ user: updated });
}
