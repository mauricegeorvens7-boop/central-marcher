import { SellerShell } from "@/components/seller/SellerShell";
import { requireSeller } from "@/lib/admin/auth";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SellerDiscountsPage() {
  const { seller } = await requireSeller();
  const products = await getProducts({ includeHidden: true, sellerId: seller.id });
  return (
    <SellerShell seller={seller} title="Réductions vendeur">
      <section className="panel">
        <h2 className="text-xl font-black">Réductions par produit</h2>
        <p className="mt-2 text-sm text-slate-600">Les réductions se modifient dans chaque fiche produit vendeur.</p>
        <div className="mt-4 grid gap-3">
          {products.map((product) => <p key={product.id} className="rounded-md bg-slate-50 p-3 text-sm font-bold">{product.name} | {product.discountJson ? "Réduction configurée" : "Aucune réduction"}</p>)}
        </div>
      </section>
    </SellerShell>
  );
}
