import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCustomer } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/admin/auth";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const user = await createCustomer(parsed.data);
    if (!user) return NextResponse.json({ error: "Could not create user" }, { status: 500 });
    await setSessionCookie(createSessionToken(user.id, user.role));
    return NextResponse.json({ ok: true, user, redirectTo: "/account" });
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}
