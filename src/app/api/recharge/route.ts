import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/admin/auth";
import { createOrderWithTransaction, getPaymentSettings } from "@/lib/db";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const formData = await request.formData();
  const method = String(formData.get("method") || "");
  const amount = Number(formData.get("amount") || 0);
  const payerPhone = String(formData.get("payerPhone") || "");
  const file = formData.get("proof");
  const settings = await getPaymentSettings();

  if (method === "moncash" && !settings.moncashEnabled) return NextResponse.json({ error: "MonCash is disabled." }, { status: 400 });
  if (method === "natcash" && !settings.natcashEnabled) return NextResponse.json({ error: "NatCash is disabled." }, { status: 400 });
  if (!(file instanceof File) || !amount || !payerPhone) return NextResponse.json({ error: "Proof, amount, and payer phone are required." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "central-market/recharge-proofs", resource_type: "image" }, (error, result) => {
      if (error || !result) reject(error);
      else resolve({ secure_url: result.secure_url, public_id: result.public_id });
    });
    stream.end(buffer);
  });

  const result = await createOrderWithTransaction({
    userId: user.id,
    type: "recharge",
    method: method as "moncash" | "natcash",
    status: "pending",
    paymentStatus: "Pending",
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone || payerPhone,
    amount,
    payerPhone,
    proofUrl: uploaded.secure_url,
    proofPublicId: uploaded.public_id,
  });
  return NextResponse.json({ ok: true, ...result });
}
