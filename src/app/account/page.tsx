import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  PackageCheck,
  ReceiptText,
  Settings,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";
import { requireUser } from "@/lib/admin/auth";
import {
  getAddressesForUser,
  getFavoritesForUser,
  getOrdersForUser,
  getPaymentSettings,
  getPaymentTransactionsForUser,
  getRecentlyViewedForUser,
} from "@/lib/db";
import { dbProductToProduct } from "@/lib/adapters";
import { money } from "@/lib/data";
import { RechargeForm } from "@/components/RechargeForm";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0] || user.name;
  const [orders, favoriteProducts, recentlyViewedProducts, addresses, transactions, paymentSettings] = await Promise.all([
    getOrdersForUser(user.id),
    getFavoritesForUser(user.id),
    getRecentlyViewedForUser(user.id),
    getAddressesForUser(user.id),
    getPaymentTransactionsForUser(user.id),
    getPaymentSettings(),
  ]);
  const favorites = favoriteProducts.map(dbProductToProduct);
  const recentlyViewed = recentlyViewedProducts.map(dbProductToProduct);
  const notifications = JSON.parse(user.notifications || "{}") as Record<string, boolean>;
  const deliveryAlerts = orders.map((order) => {
    const status = order.fulfillmentStatus === "Processing" ? "En cours" : order.fulfillmentStatus === "Delivered" ? "Livrée" : order.fulfillmentStatus;
    if (status === "En cours") return { id: `order-processing-${order.id}`, title: "Votre commande est en cours de traitement.", copy: `Commande ${order.orderNo}`, tone: "info" };
    if (status === "En livraison") return { id: `order-shipping-${order.id}`, title: "Votre commande est en route.", copy: `Commande ${order.orderNo}`, tone: "info" };
    if (status === "Livrée") return { id: `order-delivered-${order.id}`, title: "Livraison réussie.", copy: `Commande ${order.orderNo}`, tone: "success" };
    if (status === "Annulée") return { id: `order-cancelled-${order.id}`, title: "Commande annulée.", copy: `Commande ${order.orderNo}`, tone: "danger" };
    return { id: `order-new-${order.id}`, title: "Nouvelle commande reçue.", copy: `Commande ${order.orderNo}`, tone: "warning" };
  });
  const paymentAlerts = [
    ...orders.map((order) => {
      if (order.paymentStatus === "Paid") return { id: `paid-${order.id}`, title: "Paiement confirmé", copy: `Commande ${order.orderNo}`, tone: "success" };
      if (order.paymentStatus === "Rejected") return { id: `rejected-${order.id}`, title: "Paiement refusé, renvoyez une preuve", copy: `Commande ${order.orderNo}`, tone: "danger" };
      return { id: `pending-${order.id}`, title: "En attente de validation admin", copy: `Commande ${order.orderNo}`, tone: "warning" };
    }),
    ...orders
      .filter((order) => order.paymentStatus === "Paid" && order.fulfillmentStatus === "Processing")
      .map((order) => ({ id: `processing-${order.id}`, title: "Commande en préparation", copy: `Commande ${order.orderNo}`, tone: "info" })),
    ...deliveryAlerts,
    ...transactions
      .filter((tx) => tx.type === "recharge" && tx.status === "pending")
      .map((tx) => ({ id: `topup-${tx.id}`, title: "En attente de validation admin", copy: `Recharge ${money(tx.amount)} via ${tx.method}`, tone: "warning" })),
  ].slice(0, 6);

  const alertClass = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-red-200 bg-red-50 text-red-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
  } as const;

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,#d1fae5,transparent_32%),linear-gradient(180deg,#f8fafc,#eef2f7)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit overflow-hidden p-0 lg:sticky lg:top-28">
          <div className="bg-slate-950 p-5 text-white">
            <div className="relative size-20 overflow-hidden rounded-full border-4 border-white/20 bg-slate-800">
              <Image
                src={user.profilePhoto || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"}
                alt={user.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <h1 className="mt-4 text-2xl font-black">Salut, {firstName}</h1>
            <p className="mt-1 text-sm text-slate-300">{user.email}</p>
          </div>
          <nav className="grid p-3">
            {[
              [Home, "Overview", "/account"],
              [ReceiptText, "Historique commandes", "/account/orders"],
              [Heart, "Favoris", "#favorites"],
              [MapPin, "Adresses sauvegardées", "#addresses"],
              [Bell, "Notifications", "#notifications"],
              [Settings, "Paramètres compte", "/account/settings"],
            ].map(([Icon, label, href]) => (
              <Link key={String(label)} href={String(href)} className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                <span className="flex items-center gap-3"><Icon size={18} />{String(label)}</span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </nav>
        </aside>

        <section className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px] md:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1 text-xs font-black uppercase text-slate-950">
                  <Sparkles size={14} /> Espace premium
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight">Bienvenue dans ton espace, {firstName}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Suis tes commandes, retrouve tes favoris, gere tes adresses et profite de promotions personnalisees depuis un seul tableau de bord.
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Truck className="text-emerald-300" />
                  <div>
                    <p className="font-black">Suivi actif</p>
                    <p className="text-sm text-slate-300">{orders[0]?.orderNo ?? "Aucune commande"} arrive bientot</p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-3/4 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Commandes", orders.length],
              ["Favoris", favorites.length],
              ["Adresses", addresses.length],
              ["Solde", money(user.balance)],
              ["Notifications", Object.values(notifications).filter(Boolean).length],
            ].map(([label, value]) => (
              <div key={String(label)} className="panel transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm font-bold text-slate-500">{String(label)}</p>
                <p className="mt-2 text-3xl font-black">{String(value)}</p>
              </div>
            ))}
          </div>

          <section id="notifications" className="panel scroll-mt-28">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Boîte de notifications</h2>
                <p className="mt-1 text-sm text-slate-600">Statut de paiement, préparation et validation admin.</p>
              </div>
              <span className="tag">{paymentAlerts.length} message(s)</span>
            </div>
            <div className="mt-4 grid gap-3">
              {paymentAlerts.map((alert) => (
                <div key={alert.id} className={`rounded-md border p-4 ${alertClass[alert.tone as keyof typeof alertClass]}`}>
                  <p className="font-black">{alert.title}</p>
                  <p className="mt-1 text-sm opacity-80">{alert.copy}</p>
                </div>
              ))}
              {!paymentAlerts.length && (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucune notification pour le moment.</p>
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="panel">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">Commandes récentes</h2>
                <Link href="/account/orders" className="text-sm font-bold text-emerald-700">Voir tout</Link>
              </div>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-slate-200 p-4 transition hover:border-emerald-300">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-700"><PackageCheck size={20} /></span>
                        <div>
                          <p className="font-black">{order.orderNo}</p>
                          <p className="text-sm text-slate-600">Paiement: {order.paymentStatus} | Livraison: {order.fulfillmentStatus} | {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="font-black">{money(order.total)}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {["Paid", "Packed", "Shipped", "Delivered"].map((step, index) => (
                        <div key={step} className={`h-2 rounded-full ${index < 3 ? "bg-emerald-500" : "bg-slate-200"}`} title={step} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside id="addresses" className="panel scroll-mt-28">
              <h2 className="text-xl font-black">Promotions personnalisées</h2>
              <div className="mt-4 rounded-lg bg-amber-100 p-4">
                <p className="text-sm font-bold uppercase text-amber-800">Offre membre</p>
                <p className="mt-1 text-2xl font-black text-slate-950">15% sur accessoires</p>
                <p className="mt-2 text-sm text-slate-700">Basé sur tes favoris et produits récemment consultés.</p>
              </div>
              <div className="mt-4 grid gap-3">
                {addresses.slice(0, 2).map((address) => (
                  <div key={address.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-black">{address.label}</p>
                    <p className="text-slate-600">{address.line1}, {address.city}, {address.province}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <section id="favorites" className="panel scroll-mt-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="relative size-12 overflow-hidden rounded-md bg-white">
                    <Image src="/account-balance-wallet.svg" alt="Solde du compte" fill className="object-contain" sizes="48px" />
                  </span>
                  <h2 className="text-xl font-black">Solde client</h2>
                </div>
                <p className="mt-1 text-sm text-slate-600">Recharge MonCash / NatCash, puis l’admin confirme avant crédit.</p>
              </div>
              <p className="text-3xl font-black text-emerald-700">{money(user.balance)}</p>
            </div>
            <RechargeForm
              settings={{
                moncashEnabled: Number(paymentSettings.moncashEnabled),
                moncashNumber: paymentSettings.moncashNumber,
                natcashEnabled: Number(paymentSettings.natcashEnabled),
                natcashNumber: paymentSettings.natcashNumber,
                cashOnDeliveryEnabled: Number(paymentSettings.cashOnDeliveryEnabled),
              }}
            />
            <div className="mt-5 grid gap-3">
              {transactions.filter((tx) => tx.type === "recharge").map((tx) => (
                <div key={tx.id} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black">{tx.transactionNo}</p>
                    <p className="text-sm text-slate-600">{tx.method} | {tx.status}</p>
                  </div>
                  <p className="font-black">{money(tx.amount)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2 className="text-xl font-black">Favoris</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {favorites.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="300px" />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 font-black group-hover:text-emerald-700">{product.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{money(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2 className="text-xl font-black">Récemment vus</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {recentlyViewed.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="flex items-center gap-3 rounded-md bg-slate-50 p-3 transition hover:bg-emerald-50">
                  <div className="relative size-14 overflow-hidden rounded-md bg-slate-100">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="56px" />
                  </div>
                  <div>
                    <p className="line-clamp-1 text-sm font-black">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section id="settings" className="grid scroll-mt-28 gap-4 md:grid-cols-3">
            {[
              [UserRound, "Informations personnelles", user.phone || "Téléphone à compléter"],
              [Bell, "Notifications", notifications.deals ? "Deals activés" : "Deals désactivés"],
              [Settings, "Paramètres", "Langue, devise, confidentialité"],
            ].map(([Icon, title, copy]) => (
              <div key={String(title)} className="panel transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                <Icon className="text-emerald-700" />
                <h3 className="mt-3 font-black">{String(title)}</h3>
                <p className="mt-2 text-sm text-slate-600">{String(copy)}</p>
              </div>
            ))}
          </section>
        </section>
      </div>
    </div>
  );
}
