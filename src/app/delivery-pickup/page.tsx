import Link from "next/link";
import { MapPin, PackageCheck, Truck } from "lucide-react";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Delivery and pickup" };

export default function DeliveryPickupPage() {
  return (
    <>
      <PageHero title="Delivery and pickup" copy="Home delivery, store pickup, reservation windows, stock checks by location, shipping fees, and free-shipping thresholds." />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3">
        {[
          [Truck, "Home delivery", "Estimated delivery dates, carrier selection, and shipping fees."],
          [PackageCheck, "Pickup fast", "Reserve eligible items and collect local stock today."],
          [MapPin, "Store locator", "Search by city or postal code and check stock per store."],
        ].map(([Icon, title, copy]) => (
          <div key={String(title)} className="panel">
            <Icon className="text-emerald-700" />
            <h2 className="mt-3 text-xl font-black">{String(title)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{String(copy)}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <Link href="/stores" className="btn-primary">Find a store</Link>
      </div>
    </>
  );
}
