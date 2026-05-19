import { SellerShell } from "@/components/seller/SellerShell";
import { requireSeller } from "@/lib/admin/auth";
import { getOrdersForSeller } from "@/lib/db";
import { money } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SellerSalesPage() {
  const { seller } = await requireSeller();
  const orders = await getOrdersForSeller(seller.id);
  return (
    <SellerShell seller={seller} title="Ventes vendeur">
      <section className="panel">
        <h2 className="text-xl font-black">Commandes contenant vos produits</h2>
        <div className="mt-4 grid gap-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black">{order.orderNo}</h3>
                  <p className="text-sm text-slate-600">{order.customerName} | Paiement {order.paymentStatus} | Livraison {order.fulfillmentStatus}</p>
                </div>
                <p className="text-xl font-black">{money(order.total)}</p>
              </div>
              <div className="mt-3 grid gap-2">
                {order.items.filter((item) => item.seller === seller.storeName).map((item) => (
                  <p key={`${order.id}-${item.productId}-${item.variantLabel}`} className="rounded-md bg-slate-50 p-3 text-sm">
                    <strong>{item.name}</strong> | Qté {item.quantity} | {money(item.price)}
                  </p>
                ))}
              </div>
            </article>
          ))}
          {!orders.length && <p className="text-sm text-slate-600">Aucune vente pour le moment.</p>}
        </div>
      </section>
    </SellerShell>
  );
}
