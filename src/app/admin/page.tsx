import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminStats, getOrders, getProducts } from "@/lib/db";
import { money } from "@/lib/data";

export const metadata = { title: "Admin dashboard" };

export default async function AdminPage() {
  await requireAdmin();
  const stats = getAdminStats();
  const recentProducts = getProducts({ includeHidden: true }).slice(0, 5);
  const recentOrders = getOrders().slice(0, 5);

  return (
    <AdminShell title="Dashboard admin">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel"><p className="text-sm font-bold text-slate-500">Total produits</p><p className="mt-2 text-3xl font-black">{stats.totalProducts}</p></div>
        <div className="panel"><p className="text-sm font-bold text-slate-500">Total commandes</p><p className="mt-2 text-3xl font-black">{stats.totalOrders}</p></div>
        <div className="panel"><p className="text-sm font-bold text-slate-500">Total ventes</p><p className="mt-2 text-3xl font-black">{money(stats.totalSales)}</p></div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Produits récents</h2>
            <Link className="text-sm font-bold text-emerald-700" href="/admin/products">Manage</Link>
          </div>
          <div className="space-y-3">
            {recentProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                <div>
                  <p className="font-bold">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.sku} | {product.status}</p>
                </div>
                <p className="font-black">{money(product.promoPrice ?? product.price)}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Commandes récentes</h2>
            <span className="text-sm font-bold text-slate-500">Read-only demo</span>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                <div>
                  <p className="font-bold">{order.orderNo}</p>
                  <p className="text-sm text-slate-600">{order.status}</p>
                </div>
                <p className="font-black">{money(order.total)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
