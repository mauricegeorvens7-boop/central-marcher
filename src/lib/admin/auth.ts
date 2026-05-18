import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { getSellerByUserId, getUserByEmail, getUserById, type UserRole } from "@/lib/db";

const COOKIE_NAME = "store_session";

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "local-dev-admin-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, role: UserRole) {
  const payload = JSON.stringify({ userId, role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifyToken(token?: string) {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  const expected = sign(encoded);
  const ok =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) return null;
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
    userId: string;
    role: UserRole;
    exp: number;
  };
  if (payload.exp < Date.now()) return null;
  return payload;
}

export async function loginUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if ("account_status" in user && user.account_status && user.account_status !== "active") return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = verifyToken(token);
  if (!payload) return null;
  return getUserById(payload.userId) ?? null;
}

export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function getCurrentSeller() {
  const user = await getCurrentUser();
  if (user?.role !== "seller") return null;
  const seller = getSellerByUserId(user.id);
  if (!seller || seller.status !== "active") return null;
  return { user, seller };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");
  return admin;
}

export async function requireSeller() {
  const sellerSession = await getCurrentSeller();
  if (!sellerSession) redirect("/");
  return sellerSession;
}

export async function requireAdminApi() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { admin: null, response: Response.json({ error: "Access denied" }, { status: 403 }) };
  }
  return { admin, response: null };
}

export async function requireSellerApi() {
  const sellerSession = await getCurrentSeller();
  if (!sellerSession) {
    return { user: null, seller: null, response: Response.json({ error: "Access denied" }, { status: 403 }) };
  }
  return { ...sellerSession, response: null };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
