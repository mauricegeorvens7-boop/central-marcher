import Link from "next/link";
import { Clock, MapPin, ShieldCheck, Truck } from "lucide-react";
import { categories, slugify } from "@/lib/data";
import { dbProductToProduct } from "@/lib/adapters";
import { ProductGrid } from "@/components/ProductGrid";
import { Section } from "@/components/Section";
import { HomePromoGrid } from "@/components/HomePromoGrid";
import { getAnnouncements, getBanners, getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [dbProducts, allBanners, announcements] = await Promise.all([getProducts(), getBanners(), getAnnouncements()]);
  const products = dbProducts.map(dbProductToProduct);
  const banners = allBanners.filter((banner) => banner.position === "homepage_hero");
  const deals = products.filter((product) => product.oldPrice).slice(0, 4);
  const bestSellers = products.filter((product) => product.rating >= 4.6).slice(0, 4);
  const openBox = products.filter((product) => product.condition !== "New").slice(0, 4);

  return (
    <>
      {announcements.find((item) => item.type === "top_bar") && (
        <div className="bg-emerald-700 px-4 py-2 text-center text-sm font-bold text-white">
          {announcements.find((item) => item.type === "top_bar")?.text}
        </div>
      )}
      <HomePromoGrid banners={banners} />

      <Section title="Top Deals" eyebrow="Limited offers" href="/deals">
        <ProductGrid products={deals} />
      </Section>

      <Section title="Best Sellers" eyebrow="Customer favorites" href="/products">
        <ProductGrid products={bestSellers} />
      </Section>

      <Section title="New Arrivals" eyebrow="Just landed" href="/products">
        <ProductGrid products={products.slice(0, 4)} />
      </Section>

      <Section title="Open Box / Refurbished" eyebrow="Tested savings" href="/open-box">
        <ProductGrid products={openBox} />
      </Section>

      <Section title="Shop by Category" href="/products">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category} href={`/category/${slugify(category)}`} className="rounded-lg border border-slate-200 bg-white p-5 font-bold shadow-sm hover:border-emerald-300">
              {category}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Services built into the cart">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [MapPin, "Pickup in store", "Reserve local stock, choose a pickup window, and see store-level availability."],
            [ShieldCheck, "Protection Plan", "Add 1, 2, or 3 year coverage with pricing based on product category."],
            [Truck, "Fast delivery", "Estimate delivery dates, shipping fees, and free shipping eligibility."],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="panel">
              <Icon className="mb-4 text-emerald-700" size={28} />
              <h3 className="text-lg font-black">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{String(copy)}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 rounded-lg bg-emerald-700 p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <Clock size={18} /> Deal of the day
            </div>
            <h2 className="mt-2 text-2xl font-black">Extra 15% on selected refurbished smart home devices</h2>
          </div>
          <Link href="/open-box" className="btn-secondary border-white bg-white text-emerald-800">
            Browse refurbished
          </Link>
        </div>
      </section>
    </>
  );
}
