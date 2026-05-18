import { NextRequest, NextResponse } from "next/server";
import { requireSellerApi } from "@/lib/admin/auth";
import { updateSellerProfile } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const guard = await requireSellerApi();
  if (guard.response) return guard.response;
  const body = await request.json().catch(() => ({}));
  const seller = updateSellerProfile(guard.seller.id, {
    storeName: String(body.storeName || guard.seller.storeName),
    contactName: String(body.contactName || guard.seller.contactName),
    phone: body.phone ? String(body.phone) : null,
    logoUrl: body.logoUrl ? String(body.logoUrl) : null,
    coverUrl: body.coverUrl ? String(body.coverUrl) : null,
    description: body.description ? String(body.description) : null,
    returnPolicy: body.returnPolicy ? String(body.returnPolicy) : null,
    shippingDelay: body.shippingDelay ? String(body.shippingDelay) : null,
  });
  return NextResponse.json({ seller });
}
