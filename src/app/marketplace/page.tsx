import { PageHero } from "@/components/PageHero";
import { sellers } from "@/lib/data";

export const metadata = { title: "Marketplace sellers" };

export default function MarketplacePage() {
  return (
    <>
      <PageHero title="Marketplace sellers" copy="Seller profiles, ratings, shipping timelines, return policies, validation workflow, and commission controls." />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-2 lg:grid-cols-4">
        {sellers.map((seller) => (
          <article key={seller.name} className="panel">
            <h2 className="text-xl font-black">{seller.name}</h2>
            <p className="mt-2 text-sm text-slate-600">Rating {seller.rating}/5 | {seller.orders.toLocaleString()} orders</p>
            <p className="mt-2 text-sm text-slate-600">Return policy: {seller.returns}</p>
            <p className="mt-2 text-sm text-slate-600">Marketplace commission: {seller.commission}</p>
            <button className="btn-secondary mt-4">View seller</button>
          </article>
        ))}
      </div>
    </>
  );
}
