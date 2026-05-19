import { SellerShell } from "@/components/seller/SellerShell";
import { requireSeller } from "@/lib/admin/auth";
import { getSellerStats, getProducts } from "@/lib/db";
import { money } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller dashboard" };

export default async function SellerDashboardPage() {
  const { seller } = await requireSeller();
  const [stats, sellerProducts] = await Promise.all([getSellerStats(seller.id), getProducts({ includeHidden: true, sellerId: seller.id })]);
  const products = sellerProducts.slice(0, 5);
  return (
    <SellerShell seller={seller} title="Dashboard vendeur">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Produits", stats.products],
          ["Stock total", stats.stock],
          ["Commandes", stats.orders],
          ["Ventes", money(stats.revenue)],
        ].map(([label, value]) => (
          <article key={String(label)} className="panel">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-black">{value}</p>
          </article>
        ))}
      </div>
      <section className="panel mt-5">
        <h2 className="text-xl font-black">Produits récents</h2>
        <div className="mt-4 grid gap-3">
          {products.map((product) => <p key={product.id} className="rounded-md bg-slate-50 p-3 text-sm font-bold">{product.name} | {product.status} | Stock {product.stock}</p>)}
          {!products.length && <p className="text-sm text-slate-600">Aucun produit vendeur.</p>}
        </div>
      </section>
    </SellerShell>
  );
}
