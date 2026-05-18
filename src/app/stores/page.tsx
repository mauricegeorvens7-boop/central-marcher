import { PageHero } from "@/components/PageHero";
import { stores } from "@/lib/data";

export const metadata = { title: "Store locator" };

export default function StoresPage() {
  return (
    <>
      <PageHero title="Store locator" copy="Search stores by city or postal code, see hours, contact details, directions, and stock availability by location." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex gap-3">
          <input className="field flex-1" placeholder="City or postal code" />
          <button className="btn-primary">Search</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {stores.map((store) => (
            <article key={store.id} className="panel">
              <h2 className="text-xl font-black">{store.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{store.address}, {store.city}</p>
              <p className="mt-2 text-sm text-slate-600">{store.phone}</p>
              <p className="mt-2 text-sm text-slate-600">{store.hours}</p>
              <button className="btn-secondary mt-4">Directions / map</button>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
