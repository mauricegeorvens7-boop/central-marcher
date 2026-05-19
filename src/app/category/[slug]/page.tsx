import { Filters } from "@/components/Filters";
import { HomePromoGrid } from "@/components/HomePromoGrid";
import { PageHero } from "@/components/PageHero";
import { ProductGrid } from "@/components/ProductGrid";
import { categories, slugify } from "@/lib/data";
import { dbProductToProduct } from "@/lib/adapters";
import { getBanners, getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = categories.find((category) => slugify(category) === slug) ?? "Category";
  return { title: name };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = categories.find((category) => slugify(category) === slug) ?? "Products";
  const [products, banners] = await Promise.all([getProducts({ categorySlug: slug }), getBanners()]);
  const categoryProducts = products.map(dbProductToProduct);

  return (
    <>
      <PageHero title={name} copy="Shop matching products with live-style filters, seller labels, pickup availability, and delivery options." />
      <HomePromoGrid banners={banners} position="category_banner" mode="strip" />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <Filters />
        <div>
          <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold">{categoryProducts.length} matching products</p>
            <button className="btn-secondary">Infinite scroll ready</button>
          </div>
          <ProductGrid products={categoryProducts} />
        </div>
      </div>
    </>
  );
}
