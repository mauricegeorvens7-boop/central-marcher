"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Inbox, MessageSquare, XCircle } from "lucide-react";
import { money } from "@/lib/data";

type AdminMessage = {
  id: string;
  transactionNo: string;
  type: "order" | "recharge";
  method: string;
  status: "pending" | "paid" | "rejected";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  payerPhone: string | null;
  proofUrl: string | null;
  orderId: string | null;
  adminNote: string | null;
  createdAt: string;
};

type AdminSupportTicket = {
  id: string;
  ticketNo: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export function AdminMessages({ messages, supportTickets }: { messages: AdminMessage[]; supportTickets: AdminSupportTicket[] }) {
  const router = useRouter();
  const pending = messages.filter((message) => message.status === "pending");
  const resolved = messages.filter((message) => message.status !== "pending");

  async function update(id: string, status: "paid" | "rejected") {
    await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        adminNote: status === "paid" ? "Validé depuis Messages admin." : "Refusé depuis Messages admin.",
      }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel">
          <p className="text-sm font-bold text-slate-500">Paiements à traiter</p>
          <p className="mt-2 text-3xl font-black">{pending.length}</p>
        </div>
        <div className="panel">
          <p className="text-sm font-bold text-slate-500">Paiements confirmés</p>
          <p className="mt-2 text-3xl font-black">{messages.filter((item) => item.status === "paid").length}</p>
        </div>
        <div className="panel">
          <p className="text-sm font-bold text-slate-500">Messages support</p>
          <p className="mt-2 text-3xl font-black">{supportTickets.length}</p>
        </div>
      </section>

      <section className="panel">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-emerald-700" />
          <div>
            <h2 className="text-xl font-black">Messages support client</h2>
            <p className="mt-1 text-sm text-slate-600">Tous les messages envoyés depuis Paramètres compte / Support client.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          {supportTickets.map((ticket) => (
            <article key={ticket.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-slate-100 text-slate-700">{ticket.ticketNo}</span>
                    <span className="badge bg-emerald-100 text-emerald-800">{ticket.status}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black">{ticket.subject}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.name} | {ticket.email}</p>
                  <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">{ticket.message}</p>
                </div>
                <p className="text-xs font-bold text-slate-500">{new Date(ticket.createdAt).toLocaleString("fr-CA")}</p>
              </div>
            </article>
          ))}
          {!supportTickets.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucun message support pour le moment.</p>}
        </div>
      </section>

      <section className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Demandes en attente</h2>
            <p className="mt-1 text-sm text-slate-600">Dépôts, recharges et preuves MonCash/NatCash à valider.</p>
          </div>
          <Link href="/admin/payments" className="btn-secondary">
            <CreditCard size={18} /> Voir configuration paiements
          </Link>
        </div>

        <div className="mt-5 grid gap-4">
          {pending.map((message) => (
            <article key={message.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
              <div className="grid gap-4 lg:grid-cols-[150px_1fr_230px]">
                <div className="relative h-36 overflow-hidden rounded-md border border-white bg-white">
                  {message.proofUrl ? (
                    <Image src={message.proofUrl} alt="Preuve de paiement" fill className="object-contain" sizes="150px" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-bold text-slate-500">Aucune preuve</div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-amber-300 text-slate-950">Nouveau</span>
                    <span className="badge bg-white text-slate-700">{message.type === "recharge" ? "Recharge solde" : "Commande"}</span>
                    <span className="badge bg-emerald-100 text-emerald-800">{message.method}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black">{message.transactionNo}</h3>
                  <p className="mt-1 text-sm text-slate-700">{message.customerName} | {message.customerEmail}</p>
                  <p className="mt-1 text-sm text-slate-700">Téléphone: {message.customerPhone} | Numéro payé: {message.payerPhone || "N/A"}</p>
                  <p className="mt-3 text-3xl font-black">{money(message.amount)}</p>
                  {message.orderId && <p className="mt-1 text-xs font-bold text-slate-500">Commande: {message.orderId}</p>}
                  <p className="mt-2 text-xs text-slate-500">Envoyé le {new Date(message.createdAt).toLocaleString()}</p>
                </div>
                <div className="grid content-start gap-3">
                  <button className="btn-primary" onClick={() => update(message.id, "paid")}>
                    <CheckCircle2 size={18} /> Approuver dépôt
                  </button>
                  <button className="btn-secondary border-red-200 text-red-700" onClick={() => update(message.id, "rejected")}>
                    <XCircle size={18} /> Refuser
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!pending.length && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
              <Inbox className="mx-auto text-slate-400" />
              <p className="mt-3 font-black">Aucun message en attente</p>
              <p className="mt-1 text-sm text-slate-600">Les nouveaux dépôts apparaîtront ici automatiquement.</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-xl font-black">Historique récent</h2>
        <div className="mt-4 grid gap-3">
          {resolved.slice(0, 8).map((message) => (
            <div key={message.id} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black">{message.transactionNo}</p>
                <p className="text-sm text-slate-600">{message.customerName} | {message.method} | {message.status}</p>
              </div>
              <p className="font-black">{money(message.amount)}</p>
            </div>
          ))}
          {!resolved.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Aucun historique pour le moment.</p>}
        </div>
      </section>
    </div>
  );
}
