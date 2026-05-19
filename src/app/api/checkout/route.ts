import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/admin/auth";
import { createOrderWithTransaction, debitUserBalance, getPaymentSettings } from "@/lib/db";

export const runtime = "nodejs";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxBytes = 5 * 1024 * 1024;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadProof(file: File) {
  if (!allowedTypes.includes(file.type)) throw new Error("Only image proofs are accepted.");
  if (file.size > maxBytes) throw new Error("Proof image max size is 5MB.");
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "central-market/payment-proofs", resource_type: "image" }, (error, result) => {
      if (error || !result) reject(error);
      else resolve({ secure_url: result.secure_url, public_id: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const formData = await request.formData();
  const method = String(formData.get("method") || "");
  const customerName = String(formData.get("customerName") || user?.name || "");
  const customerEmail = String(formData.get("customerEmail") || user?.email || "");
  const customerPhone = String(formData.get("customerPhone") || user?.phone || "");
  const amount = Number(formData.get("amount") || 0);
  const orderTotal = Number(formData.get("orderTotal") || amount);
  const payerPhone = String(formData.get("payerPhone") || "");
  const items = JSON.parse(String(formData.get("items") || "[]"));
  const shippingAddress = String(formData.get("shippingAddress") || "");

  if (!customerName || !customerEmail || !customerPhone || !amount || !orderTotal || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: "Missing checkout information." }, { status: 400 });
  }

  const settings = await getPaymentSettings();
  if (method === "moncash" && !settings.moncashEnabled) return NextResponse.json({ error: "MonCash is disabled." }, { status: 400 });
  if (method === "natcash" && !settings.natcashEnabled) return NextResponse.json({ error: "NatCash is disabled." }, { status: 400 });
  if (method === "cash_on_delivery" && !settings.cashOnDeliveryEnabled) return NextResponse.json({ error: "Cash on delivery is disabled." }, { status: 400 });

  try {
    if (method === "balance") {
      if (!user) return NextResponse.json({ error: "Login required for account balance payment." }, { status: 401 });
      if (!(await debitUserBalance(user.id, amount))) return NextResponse.json({ error: "Solde insuffisant." }, { status: 400 });
      const result = await createOrderWithTransaction({
        userId: user.id,
        method: "balance",
        status: "paid",
        paymentStatus: "Paid",
        customerName,
        customerEmail,
        customerPhone,
        amount,
        orderTotal: amount,
        items,
        shippingAddress,
      });
      return NextResponse.json({ ok: true, ...result, status: "paid" });
    }

    if (method === "moncash" || method === "natcash") {
      const file = formData.get("proof");
      if (!(file instanceof File)) return NextResponse.json({ error: "Payment proof image is required." }, { status: 400 });
      const uploaded = await uploadProof(file);
      const result = await createOrderWithTransaction({
        userId: user?.id || null,
        method,
        status: "pending",
        paymentStatus: "Pending",
        customerName,
        customerEmail,
        customerPhone,
        amount,
        orderTotal,
        payerPhone,
        proofUrl: uploaded.secure_url,
        proofPublicId: uploaded.public_id,
        items,
        shippingAddress,
      });
      return NextResponse.json({ ok: true, ...result, status: "payment_pending" });
    }

    if (method === "cash_on_delivery") {
      const result = await createOrderWithTransaction({
        userId: user?.id || null,
        method: "cash_on_delivery",
        status: "pending",
        paymentStatus: "Pending",
        customerName,
        customerEmail,
        customerPhone,
        amount,
        orderTotal: amount,
        items,
        shippingAddress,
      });
      return NextResponse.json({ ok: true, ...result, status: "cash_on_delivery_pending" });
    }

    return NextResponse.json({ error: "Stripe is not configured yet. Choose MonCash, NatCash, balance, or cash on delivery." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed." }, { status: 500 });
  }
}
