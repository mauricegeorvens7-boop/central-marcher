import { PageHero } from "@/components/PageHero";
import { protectionPlans } from "@/lib/data";

export const metadata = { title: "Protection plans" };

export default function ProtectionPage() {
  return (
    <>
      <PageHero title="Protection plans" copy="Upsell product protection by category, add coverage to cart, and manage plans inside the customer account." />
      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8 md:grid-cols-3">
        {protectionPlans.map((plan) => (
          <div key={plan.id} className="panel">
            <h2 className="text-xl font-black">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-600">Coverage price is calculated from product price and category risk rules.</p>
            <button className="btn-primary mt-4">Add to cart</button>
          </div>
        ))}
      </div>
    </>
  );
}
