import { SellerShell } from "@/components/seller/SellerShell";
import { requireSeller } from "@/lib/admin/auth";
import { getTicketsForSeller } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SellerMessagesPage() {
  const { seller } = await requireSeller();
  const tickets = getTicketsForSeller(seller.id);
  return (
    <SellerShell seller={seller} title="Messages clients">
      <section className="panel">
        <h2 className="text-xl font-black">Messages liés à votre boutique</h2>
        <div className="mt-4 grid gap-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-md border border-slate-200 p-4">
              <h3 className="font-black">{ticket.subject}</h3>
              <p className="text-sm text-slate-600">{ticket.name} | {ticket.email} | {ticket.status}</p>
              <p className="mt-2 text-sm leading-6">{ticket.message}</p>
            </article>
          ))}
          {!tickets.length && <p className="text-sm text-slate-600">Aucun message vendeur.</p>}
        </div>
      </section>
    </SellerShell>
  );
}
