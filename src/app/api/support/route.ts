import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin/auth";
import { createSupportTicket } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || user?.name || "");
  const email = String(body.email || user?.email || "");
  const subject = String(body.subject || "");
  const message = String(body.message || "");
  if (!name || !email || !subject || !message) return NextResponse.json({ error: "Message incomplet." }, { status: 400 });
  const ticket = createSupportTicket({ userId: user?.id || null, name, email, subject, message });

  return NextResponse.json({
    ok: true,
    ticketId: ticket?.ticketNo,
    status: ticket?.status || "open",
  });
}
