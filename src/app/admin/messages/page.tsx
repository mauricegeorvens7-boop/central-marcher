import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMessages } from "@/components/admin/AdminMessages";
import { requireAdmin } from "@/lib/admin/auth";
import { getPaymentTransactions, getSupportTickets } from "@/lib/db";

export const metadata = { title: "Admin messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const transactions = getPaymentTransactions();
  const tickets = getSupportTickets();
  const messages = transactions.map((tx) => ({
    id: tx.id,
    transactionNo: tx.transactionNo,
    type: tx.type,
    method: tx.method,
    status: tx.status,
    customerName: tx.customerName,
    customerEmail: tx.customerEmail,
    customerPhone: tx.customerPhone,
    amount: Number(tx.amount),
    payerPhone: tx.payerPhone,
    proofUrl: tx.proofUrl,
    orderId: tx.orderId,
    adminNote: tx.adminNote,
    createdAt: tx.createdAt,
  }));

  return (
    <AdminShell title="Messages admin">
      <AdminMessages
        messages={messages}
        supportTickets={tickets.map((ticket) => ({
          id: ticket.id,
          ticketNo: ticket.ticketNo,
          userId: ticket.userId,
          name: ticket.name,
          email: ticket.email,
          subject: ticket.subject,
          message: ticket.message,
          status: ticket.status,
          createdAt: ticket.createdAt,
        }))}
      />
    </AdminShell>
  );
}
