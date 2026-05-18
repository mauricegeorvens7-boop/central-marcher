import Image from "next/image";
import Link from "next/link";
import { Heart, Scale, ShoppingCart, Star } from "lucide-react";
import { money, Product } from "@/lib/data";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] bg-slate-100">
        <Image src={product.image} alt={product.name} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.badge && <span className="badge bg-emerald-600 text-white">{product.badge}</span>}
          {discount > 0 && <span className="badge bg-amber-400 text-slate-950">-{discount}%</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{product.brand}</span>
          <button className="grid size-8 place-items-center rounded-md border border-slate-200" aria-label="Add to favorites">
            <Heart size={17} />
          </button>
        </div>
        <Link href={`/products/${product.slug}`} className="line-clamp-2 min-h-11 font-semibold text-slate-950 hover:text-emerald-700">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-sm">
          <Star size={16} className="fill-amber-400 text-amber-400" />
          <span className="font-semibold">{product.rating}</span>
          <span className="text-slate-500">({product.reviews})</span>
        </div>
        <div className="mt-3">
          <span className="text-xl font-black text-slate-950">{money(product.price)}</span>
          {product.oldPrice && <span className="ml-2 text-sm text-slate-500 line-through">{money(product.oldPrice)}</span>}
        </div>
        <div className="mt-3 grid gap-1 text-xs text-slate-600">
          <span>{product.online ? "Online in stock" : "Online unavailable"}</span>
          <span>{product.pickup ? "Pickup available today" : "Delivery only"}</span>
          <span>Sold and shipped by {product.seller}</span>
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          <button className="btn-primary flex-1">
            <ShoppingCart size={17} />
            Add
          </button>
          <button className="btn-secondary" aria-label="Compare">
            <Scale size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
