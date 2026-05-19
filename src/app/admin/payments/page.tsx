import { AdminShell } from "@/components/admin/AdminShell";
import { PaymentManager } from "@/components/admin/PaymentManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getPaymentSettings, getPaymentTransactions } from "@/lib/db";

export const metadata = { title: "Admin payments" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const [settings, allTransactions] = await Promise.all([getPaymentSettings(), getPaymentTransactions()]);
  const transactions = allTransactions.filter(
    (tx) => tx.type === "recharge" || tx.method === "moncash" || tx.method === "natcash",
  );
  return (
    <AdminShell title="Paiements manuels">
      <PaymentManager
        settings={{
          moncashEnabled: Number(settings.moncashEnabled),
          moncashNumber: settings.moncashNumber,
          natcashEnabled: Number(settings.natcashEnabled),
          natcashNumber: settings.natcashNumber,
          cashOnDeliveryEnabled: Number(settings.cashOnDeliveryEnabled),
        }}
        transactions={transactions.map((tx) => ({
          id: tx.id,
          transactionNo: tx.transactionNo,
          userId: tx.userId,
          orderId: tx.orderId,
          type: tx.type,
          method: tx.method,
          status: tx.status,
          customerName: tx.customerName,
          customerEmail: tx.customerEmail,
          customerPhone: tx.customerPhone,
          amount: Number(tx.amount),
          payerPhone: tx.payerPhone,
          proofUrl: tx.proofUrl,
          proofPublicId: tx.proofPublicId,
          adminNote: tx.adminNote,
          createdAt: tx.createdAt,
        }))}
      />
    </AdminShell>
  );
}
