import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Returns" };

export default function ReturnsPage() {
  return (
    <>
      <PageHero title="Returns" copy="Start a return from an order, choose a reason, upload photos, track status, and generate a simulated return label." />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1fr_320px]">
        <form className="panel grid gap-3">
          <input className="field" placeholder="Order number" />
          <select className="field"><option>Reason for return</option><option>Damaged</option><option>Wrong item</option><option>No longer needed</option></select>
          <input className="field" type="file" />
          <textarea className="min-h-32 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Details" />
          <button className="btn-primary">Submit return request</button>
        </form>
        <aside className="panel">
          <h2 className="font-black">Return policy</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Most new products support 30-day returns. Marketplace and refurbished items can have seller-specific timelines.</p>
          <div className="mt-4 rounded-md bg-slate-100 p-3 text-sm font-bold">Simulated label: RET-CM-20491</div>
        </aside>
      </div>
    </>
  );
}
