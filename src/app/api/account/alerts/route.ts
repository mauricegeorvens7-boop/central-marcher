import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin/auth";
import { getAccountAlertSnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") return NextResponse.json({ authenticated: false, signature: "" });
  const snapshot = getAccountAlertSnapshot(user.id);
  return NextResponse.json({ authenticated: true, ...snapshot });
}
