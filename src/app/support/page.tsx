import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Support" };

const topics = ["Order status", "Shipping", "Returns", "Payment", "Warranty", "Marketplace sellers"];

export default function SupportPage() {
  return (
    <>
      <PageHero title="Support center" copy="FAQ topics, order status help, returns, warranty, contact form, simulated chat, and support tickets." />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-3 md:grid-cols-2">
          {topics.map((topic) => (
            <div key={topic} className="panel">
              <h2 className="font-black">{topic}</h2>
              <p className="mt-2 text-sm text-slate-600">FAQ answers and guided flows for {topic.toLowerCase()}.</p>
            </div>
          ))}
        </section>
        <aside className="panel h-fit">
          <h2 className="text-xl font-black">Contact form</h2>
          <div className="mt-4 grid gap-3">
            <input className="field" placeholder="Email" />
            <select className="field"><option>Support category</option>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select>
            <textarea className="min-h-28 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="How can we help?" />
            <button className="btn-primary">Create ticket</button>
            <button className="btn-secondary">Open simulated chat</button>
          </div>
        </aside>
      </div>
    </>
  );
}
