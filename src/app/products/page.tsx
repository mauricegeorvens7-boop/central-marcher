import { Filters } from "@/components/Filters";
import { PageHero } from "@/components/PageHero";
import { ProductGrid } from "@/components/ProductGrid";
import { dbProductToProduct } from "@/lib/adapters";
import { getProducts } from "@/lib/db";

export const metadata = {
  title: "Products",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const products = (await getProducts()).map(dbProductToProduct);
  const query = params.q?.toLowerCase() ?? "";
  const filtered = query
    ? products.filter((product) =>
        [product.name, product.brand, product.category, product.sku].some((value) => value.toLowerCase().includes(query)),
      )
    : products;

  return (
    <>
      <PageHero
        title="All products"
        copy="Browse the catalog with filters for price, brand, rating, availability, condition, seller, shipping, and pickup."
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <Filters />
        <div>
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{filtered.length} results {query && `for "${query}"`}</p>
            <select className="field sm:w-48" defaultValue={params.sort ?? "featured"}>
              <option value="featured">Featured</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
          <ProductGrid products={filtered} />
        </div>
      </div>
    </>
  );
}
