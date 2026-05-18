import { Clock } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ProductGrid } from "@/components/ProductGrid";
import { dbProductToProduct } from "@/lib/adapters";
import { getProducts } from "@/lib/db";

export const metadata = { title: "Deals" };
export const dynamic = "force-dynamic";

export default function DealsPage() {
  const products = getProducts().map(dbProductToProduct);
  const deals = products.filter((product) => product.oldPrice);
  return (
    <>
      <PageHero title="Deals and promotions" copy="Top deals, deal of the day, clearance, coupons, open-box markdowns, and discount badges." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-amber-300 p-5 text-slate-950 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Clock />
            <div>
              <h2 className="font-black">Deal of the day</h2>
              <p className="text-sm">Ends in 08:42:16. Countdown component ready for real timers.</p>
            </div>
          </div>
          <button className="btn-secondary border-slate-950">Clip coupon</button>
        </div>
        <ProductGrid products={deals} />
      </div>
    </>
  );
}
