import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { getAdminOrders, getPaymentTransactions } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard.response) return guard.response;

  const [orders, payments] = await Promise.all([getAdminOrders(), getPaymentTransactions()]);
  const latestOrder = orders[0];
  const latestPayment = payments
    .filter((tx) => tx.status === "pending" && (tx.type === "recharge" || tx.method === "moncash" || tx.method === "natcash"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return NextResponse.json({
    orderSignature: latestOrder ? `${latestOrder.id}:${latestOrder.createdAt}` : "",
    paymentSignature: latestPayment ? `${latestPayment.id}:${latestPayment.createdAt}:${latestPayment.status}` : "",
  });
}
