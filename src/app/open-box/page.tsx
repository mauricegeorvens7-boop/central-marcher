import { PageHero } from "@/components/PageHero";
import { ProductGrid } from "@/components/ProductGrid";
import { dbProductToProduct } from "@/lib/adapters";
import { getProducts } from "@/lib/db";

export const metadata = { title: "Open Box and Refurbished" };
export const dynamic = "force-dynamic";

export default async function OpenBoxPage() {
  const products = (await getProducts()).map(dbProductToProduct);
  return (
    <>
      <PageHero
        title="Open Box and Refurbished"
        copy="Condition-specific pricing for Open Box Excellent, Open Box Good, and Refurbished products, with warranty labels and tested inventory."
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          {["New", "Open Box Excellent", "Open Box Good", "Refurbished"].map((condition) => (
            <div key={condition} className="panel">
              <h2 className="font-black">{condition}</h2>
              <p className="mt-2 text-sm text-slate-600">Condition description and return policy rules.</p>
            </div>
          ))}
        </div>
        <ProductGrid products={products.filter((product) => product.condition !== "New")} />
      </div>
    </>
  );
}
