import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, ReceiptText, UserRound, WalletCards } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CustomerStatusControl } from "@/components/admin/CustomerStatusControl";
import { requireAdmin } from "@/lib/admin/auth";
import { getCustomerAdminProfile } from "@/lib/db";
import { money } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const profile = getCustomerAdminProfile(id);
  if (!profile) notFound();
  const { user, addresses, orders, transactions, tickets } = profile;

  return (
    <AdminShell title={`Client ${user.name}`}>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-emerald-700"><ArrowLeft size={17} /> Retour clients</Link>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="grid gap-6">
          <div className="panel">
            <div className="grid gap-4 md:grid-cols-[96px_1fr]">
              <div className="relative size-24 overflow-hidden rounded-full bg-slate-100">
                {user.profilePhoto ? <Image src={user.profilePhoto} alt={user.name} fill className="object-cover" sizes="96px" /> : <UserRound className="m-7 text-slate-400" />}
              </div>
              <div>
                <h2 className="text-2xl font-black">{user.name}</h2>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <p className="flex items-center gap-2"><Mail size={16} /> {user.email}</p>
                  <p className="flex items-center gap-2"><Phone size={16} /> {user.phone || "Téléphone absent"}</p>
                  <p>Sexe: <strong>{user.gender || "Non renseigné"}</strong></p>
                  <p>Naissance: <strong>{user.birthDate || "Non renseignée"}</strong></p>
                  <p>Solde: <strong>{money(user.balance)}</strong></p>
                  <p>Statut: <strong>{user.accountStatus}</strong></p>
                </div>
              </div>
            </div>
          </div>

          <section className="panel">
            <h2 className="flex items-center gap-2 text-xl font-black"><ReceiptText size={20} /> Commandes / historique achats</h2>
            <div className="mt-4 grid gap-3">
              {orders.map((order) => <Link key={order.id} href={`/admin/orders/${order.id}`} className="rounded-md border border-slate-200 p-3 hover:border-emerald-300"><strong>{order.orderNo}</strong><p className="text-sm text-slate-600">{order.paymentStatus} | {order.fulfillmentStatus} | {new Date(order.createdAt).toLocaleString("fr-CA")}</p><p className="font-black">{money(order.total)}</p></Link>)}
              {!orders.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucune commande.</p>}
            </div>
          </section>

          <section className="panel">
            <h2 className="flex items-center gap-2 text-xl font-black"><WalletCards size={20} /> Recharges et transactions</h2>
            <div className="mt-4 grid gap-3">
              {transactions.map((tx) => <div key={tx.id} className="rounded-md border border-slate-200 p-3"><strong>{tx.transactionNo}</strong><p className="text-sm text-slate-600">{tx.type} | {tx.method} | {tx.status} | {new Date(tx.createdAt).toLocaleString("fr-CA")}</p><p className="font-black">{money(tx.amount)}</p></div>)}
            </div>
          </section>

          <section className="panel">
            <h2 className="flex items-center gap-2 text-xl font-black"><MapPin size={20} /> Adresses</h2>
            <div className="mt-4 grid gap-3">
              {addresses.map((address) => <p key={address.id} className="rounded-md bg-slate-50 p-3 text-sm"><strong>{address.label}</strong> {address.isDefault ? "(défaut)" : ""}<br />{address.line1}, {address.city}, {address.province} {address.postalCode}</p>)}
            </div>
          </section>

          <section className="panel">
            <h2 className="text-xl font-black">Support / activité</h2>
            <div className="mt-4 grid gap-3">
              {tickets.map((ticket) => <p key={ticket.id} className="rounded-md bg-slate-50 p-3 text-sm"><strong>{ticket.ticketNo}</strong> | {ticket.subject} | {ticket.status}</p>)}
              {!tickets.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucun ticket support.</p>}
            </div>
          </section>
        </section>

        <aside className="panel h-fit xl:sticky xl:top-28">
          <h2 className="text-xl font-black">Statut compte</h2>
          <p className="mt-1 text-sm text-slate-600">Suspendre ou bannir bloque la connexion du client.</p>
          <div className="mt-4"><CustomerStatusControl userId={user.id} currentStatus={user.accountStatus} /></div>
        </aside>
      </div>
    </AdminShell>
  );
}
