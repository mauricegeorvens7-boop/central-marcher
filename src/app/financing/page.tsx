import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Financing" };

export default function FinancingPage() {
  return (
    <>
      <PageHero title="Financing" copy="Future financing options for eligible orders, with payment estimates and checkout integration points." />
      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8 md:grid-cols-3">
        {["6 months", "12 months", "24 months"].map((term) => (
          <div key={term} className="panel">
            <h2 className="text-xl font-black">{term}</h2>
            <p className="mt-2 text-sm text-slate-600">Prequalification, disclosure text, and payment schedule placeholder.</p>
            <button className="btn-secondary mt-4">Estimate</button>
          </div>
        ))}
      </div>
    </>
  );
}
