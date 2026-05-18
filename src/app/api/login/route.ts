import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, loginUser, setSessionCookie } from "@/lib/admin/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = schema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

  const user = await loginUser(body.data.email, body.data.password);
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await setSessionCookie(createSessionToken(user.id, user.role));
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    redirectTo: user.role === "admin" ? "/admin" : user.role === "seller" ? "/seller" : "/account",
  });
}
