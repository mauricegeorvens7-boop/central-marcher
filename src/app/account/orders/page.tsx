import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { requireUser } from "@/lib/admin/auth";
import { getAllOrdersForUser } from "@/lib/db";
import { money } from "@/lib/data";

export const metadata = { title: "Historique commandes" };
export const dynamic = "force-dynamic";

function clientStatus(status: string) {
  if (status === "Processing" || status === "En cours") return "Votre commande est en cours de traitement.";
  if (status === "En livraison") return "Votre commande est en route.";
  if (status === "Delivered" || status === "Livrée") return "Livraison réussie.";
  if (status === "Annulée") return "Commande annulée.";
  return "Nouvelle commande reçue.";
}

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = getAllOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black">Historique commandes</h1>
      <div className="mt-5 space-y-4">
        {orders.map((order) => (
          <Link key={order.id} href={`/account/orders/${order.id}`} className="panel block hover:border-emerald-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <PackageCheck size={20} />
                </span>
                <div>
                  <h2 className="font-black">{order.orderNo}</h2>
                  <p className="text-sm text-slate-600">{clientStatus(order.fulfillmentStatus)} | Paiement {order.paymentStatus}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("fr-CA")}</p>
                </div>
              </div>
              <p className="text-xl font-black">{money(order.total)}</p>
            </div>
          </Link>
        ))}
        {!orders.length && <p className="panel text-sm text-slate-600">Aucune commande pour le moment.</p>}
      </div>
    </div>
  );
}
