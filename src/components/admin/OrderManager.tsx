"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Mail, Phone, Search, UserRound } from "lucide-react";
import { money } from "@/lib/data";
import type { AdminOrder } from "@/lib/db";
import { OrderStatusControl } from "./OrderStatusControl";

export const orderStatusStyles: Record<string, string> = {
  "Nouvelle commande": "border-sky-200 bg-sky-50 text-sky-900",
  "En cours": "border-amber-200 bg-amber-50 text-amber-900",
  "En livraison": "border-violet-200 bg-violet-50 text-violet-900",
  "Livrée": "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Annulée": "border-red-200 bg-red-50 text-red-900",
  Processing: "border-amber-200 bg-amber-50 text-amber-900",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

const statuses = ["Tous", "Nouvelle commande", "En cours", "En livraison", "Livrée", "Annulée"];

function normalizedStatus(order: AdminOrder) {
  if (order.fulfillmentStatus === "Processing") return "En cours";
  if (order.fulfillmentStatus === "Delivered") return "Livrée";
  if (order.fulfillmentStatus === "Waiting payment") return "Nouvelle commande";
  return order.fulfillmentStatus || order.status || "Nouvelle commande";
}

export function OrderManager({ orders }: { orders: AdminOrder[] }) {
  const [filters, setFilters] = useState({
    query: "",
    status: "Tous",
    paymentStatus: "Tous",
    paymentMethod: "Tous",
    startDate: "",
    endDate: "",
  });

  const filteredOrders = useMemo(() => {
    const q = filters.query.toLowerCase().trim();
    const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`).getTime() : null;
    const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`).getTime() : null;

    return orders
      .filter((order) => {
        const orderStatus = normalizedStatus(order);
        const createdAt = new Date(order.createdAt).getTime();
        const haystack = `${order.orderNo} ${order.customerName} ${order.customerEmail} ${order.customerPhone} ${order.paymentMethod} ${order.shippingAddress}`.toLowerCase();
        return (
          (!q || haystack.includes(q)) &&
          (filters.status === "Tous" || orderStatus === filters.status) &&
          (filters.paymentStatus === "Tous" || order.paymentStatus === filters.paymentStatus) &&
          (filters.paymentMethod === "Tous" || order.paymentMethod === filters.paymentMethod) &&
          (start === null || createdAt >= start) &&
          (end === null || createdAt <= end)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filters]);

  return (
    <div className="grid gap-5">
      <section className="panel">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Filtres commandes</h2>
            <p className="mt-1 text-sm text-slate-600">{filteredOrders.length} résultat(s) sur {orders.length}</p>
          </div>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setFilters({ query: "", status: "Tous", paymentStatus: "Tous", paymentMethod: "Tous", startDate: "", endDate: "" })}
          >
            Réinitialiser
          </button>
        </div>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
            <Search size={18} className="text-slate-400" />
            <input
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder="Rechercher par client, email, téléphone ou commande"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            />
          </label>
          <select className="field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="field" value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })}>
            <option value="Tous">Tous paiements</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select className="field" value={filters.paymentMethod} onChange={(event) => setFilters({ ...filters, paymentMethod: event.target.value })}>
            <option value="Tous">Toutes méthodes</option>
            <option value="moncash">MonCash</option>
            <option value="natcash">NatCash</option>
            <option value="balance">Solde</option>
            <option value="cash_on_delivery">Paiement livraison</option>
            <option value="stripe">Stripe</option>
          </select>
          <input className="field" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} />
          <input className="field" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} />
        </div>
      </section>

      <section className="grid gap-4">
        {filteredOrders.map((order) => {
          const statusLabel = normalizedStatus(order);
          const firstItem = order.items[0];
          return (
            <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
                <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
                  <div className="relative size-20 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-50">
                    {order.user.profilePhoto ? (
                      <Image src={order.user.profilePhoto} alt={order.customerName} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-400">
                        <UserRound />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/orders/${order.id}`} className="text-xl font-black hover:text-emerald-700">
                        {order.orderNo}
                      </Link>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${orderStatusStyles[statusLabel] || orderStatusStyles["Nouvelle commande"]}`}>
                        {statusLabel}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{order.paymentStatus}</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-800">{order.paymentMethod || "N/A"}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <p className="font-bold text-slate-950">{order.customerName}</p>
                      <p className="flex items-center gap-2"><Mail size={15} /> {order.customerEmail || "Email absent"}</p>
                      <p className="flex items-center gap-2"><Phone size={15} /> {order.customerPhone || "Téléphone absent"}</p>
                      <p className="flex items-center gap-2">
                        <CalendarClock size={15} />
                        {new Date(order.createdAt).toLocaleDateString("fr-CA")} à {new Date(order.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{order.shippingAddress || "Adresse livraison non renseignée"}</p>
                    <div className="mt-4 grid gap-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={`${item.id || item.name}-${index}`} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                          <div className="relative size-12 overflow-hidden rounded-md bg-white">
                            {item.image && <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="48px" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-black">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              {item.variantLabel || "Aucune variante"} | Qty {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-black">{money(item.price * item.quantity)}</p>
                        </div>
                      ))}
                      {!firstItem && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Aucun produit enregistré dans cette commande.</p>}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-2xl font-black">{money(order.total)}</p>
                      <Link className="btn-secondary" href={`/admin/orders/${order.id}`}>Voir détail</Link>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <OrderStatusControl orderId={order.id} currentStatus={statusLabel} />
                </div>
              </div>
            </article>
          );
        })}
        {!filteredOrders.length && <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Aucune commande trouvée.</p>}
      </section>
    </div>
  );
}
