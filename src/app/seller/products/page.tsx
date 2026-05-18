import { SellerShell } from "@/components/seller/SellerShell";
import { SellerProductManager } from "@/components/seller/SellerProductManager";
import { requireSeller } from "@/lib/admin/auth";
import { getCategories, getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const { seller } = await requireSeller();
  return (
    <SellerShell seller={seller} title="Produits vendeur">
      <SellerProductManager products={getProducts({ includeHidden: true, sellerId: seller.id })} categories={getCategories()} />
    </SellerShell>
  );
}
