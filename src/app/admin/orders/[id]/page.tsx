import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, ReceiptText, UserRound } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminOrderById } from "@/lib/db";
import { money } from "@/lib/data";

export const dynamic = "force-dynamic";

function displayStatus(status: string) {
  if (status === "Processing") return "En cours";
  if (status === "Delivered") return "Livrée";
  if (status === "Waiting payment") return "Nouvelle commande";
  return status || "Nouvelle commande";
}

const orderStatusStyles: Record<string, string> = {
  "Nouvelle commande": "border-sky-200 bg-sky-50 text-sky-900",
  "En cours": "border-amber-200 bg-amber-50 text-amber-900",
  "En livraison": "border-violet-200 bg-violet-50 text-violet-900",
  "Livrée": "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Annulée": "border-red-200 bg-red-50 text-red-900",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = getAdminOrderById(id);
  if (!order) notFound();

  const status = displayStatus(order.fulfillmentStatus);

  return (
    <AdminShell title={`Commande ${order.orderNo}`}>
      <div className="mb-4">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-black text-emerald-700">
          <ArrowLeft size={17} /> Retour commandes
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-6">
          <div className="panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black">{order.orderNo}</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${orderStatusStyles[status] || orderStatusStyles["Nouvelle commande"]}`}>
                    {status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{order.paymentStatus}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{new Date(order.createdAt).toLocaleString("fr-CA")}</p>
              </div>
              <p className="text-3xl font-black">{money(order.total)}</p>
            </div>
          </div>

          <div className="panel">
            <h2 className="text-xl font-black">Informations client</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[96px_1fr]">
              <div className="relative size-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-50">
                {order.user.profilePhoto ? (
                  <Image src={order.user.profilePhoto} alt={order.customerName} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-400">
                    <UserRound size={34} />
                  </div>
                )}
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p><span className="block text-xs font-bold uppercase text-slate-500">Nom</span><strong>{order.customerName}</strong></p>
                <p><span className="block text-xs font-bold uppercase text-slate-500">Sexe</span><strong>{order.user.gender || "Non renseigné"}</strong></p>
                <p className="flex items-center gap-2"><Mail size={16} /> {order.customerEmail || "Email absent"}</p>
                <p className="flex items-center gap-2"><Phone size={16} /> {order.customerPhone || "Téléphone absent"}</p>
                <p className="md:col-span-2 flex items-start gap-2"><MapPin size={16} className="mt-0.5" /> {order.shippingAddress || "Adresse non renseignée"}</p>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2 className="text-xl font-black">Produits achetés</h2>
            <div className="mt-4 grid gap-3">
              {order.items.map((item, index) => (
                <div key={`${item.id || item.name}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[76px_1fr_auto] md:items-center">
                  <div className="relative size-20 overflow-hidden rounded-md bg-slate-50">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="80px" />}
                  </div>
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">SKU {item.sku || "N/A"} | {item.brand || "Marque non renseignée"}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">Variante: {item.variantLabel || "Aucune variante"}</p>
                    <p className="mt-1 text-xs text-slate-500">Vendu par {item.seller || "Central Marcher"}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-slate-600">Qté {item.quantity}</p>
                    <p className="text-lg font-black">{money(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              {!order.items.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucun produit enregistré.</p>}
            </div>
          </div>

          <div className="panel">
            <h2 className="text-xl font-black">Preuve de paiement</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[240px_1fr]">
              <div className="relative h-48 overflow-hidden rounded-lg bg-slate-100">
                {order.paymentProof.proofUrl ? (
                  <Image src={order.paymentProof.proofUrl} alt="Preuve paiement" fill className="object-contain" sizes="240px" />
                ) : (
                  <div className="grid h-full place-items-center text-sm font-bold text-slate-500">Aucune preuve</div>
                )}
              </div>
              <div className="grid content-start gap-2 text-sm">
                <p><span className="font-black">Méthode:</span> {order.paymentMethod || "N/A"}</p>
                <p><span className="font-black">Transaction:</span> {order.paymentProof.transactionNo || "N/A"}</p>
                <p><span className="font-black">Numéro payé:</span> {order.paymentProof.payerPhone || "N/A"}</p>
                <p><span className="font-black">Statut preuve:</span> {order.paymentProof.status || "N/A"}</p>
                <p><span className="font-black">Note admin:</span> {order.paymentProof.adminNote || "Aucune note"}</p>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2 className="flex items-center gap-2 text-xl font-black"><ReceiptText size={20} /> Historique statut</h2>
            <div className="mt-4 grid gap-3">
              {order.history.map((entry) => (
                <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-black">{entry.status}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString("fr-CA")}</p>
                  {entry.note && <p className="mt-1 text-sm text-slate-700">{entry.note}</p>}
                </div>
              ))}
              {!order.history.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucun changement enregistré pour le moment.</p>}
            </div>
          </div>
        </section>

        <aside className="panel h-fit xl:sticky xl:top-28">
          <h2 className="text-xl font-black">Modifier statut</h2>
          <p className="mt-1 text-sm text-slate-600">Le client verra automatiquement la mise à jour dans son espace compte.</p>
          <div className="mt-4">
            <OrderStatusControl orderId={order.id} currentStatus={status} />
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
