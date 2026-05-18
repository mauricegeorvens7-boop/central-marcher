import { PageHero } from "@/components/PageHero";
import { ProductGrid } from "@/components/ProductGrid";
import { dbProductToProduct } from "@/lib/adapters";
import { getProducts } from "@/lib/db";

export const metadata = { title: "Favorites" };
export const dynamic = "force-dynamic";

export default function FavoritesPage() {
  const products = getProducts().map(dbProductToProduct);
  return (
    <>
      <PageHero title="Favorites" copy="Saved products, comparison candidates, and future price-drop alerts for signed-in customers." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ProductGrid products={products.slice(2, 6)} />
      </div>
    </>
  );
}
