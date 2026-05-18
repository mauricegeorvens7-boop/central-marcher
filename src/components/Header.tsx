"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  MapPin,
  Menu,
  PackageSearch,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { categories, products, slugify } from "@/lib/data";
import { CART_UPDATED_EVENT, getCartCount } from "@/lib/cart";

export function Header() {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartCount());
    }
    syncCartCount();
    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener("storage", syncCartCount);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products.slice(0, 3);
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.brand.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [query]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          className="grid size-10 place-items-center rounded-md border border-slate-200 lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle menu"
          suppressHydrationWarning
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/" className="relative block h-10 w-24 shrink-0 sm:h-11 sm:w-28" aria-label="Central Marcher home">
          <Image
            src="/central-marcher-logo-transparent.png"
            alt="Central Marcher"
            fill
            priority
            sizes="112px"
            className="object-contain object-left"
          />
        </Link>
        <nav className="hidden items-center gap-2 lg:flex">
          <Link className="nav-pill" href="/products">
            Categories
          </Link>
          <Link className="nav-pill" href="/deals">
            Deals
          </Link>
        </nav>
        <div className="relative mx-auto hidden w-full max-w-2xl md:block">
          <form action="/products" className="flex rounded-lg border border-slate-300 bg-white shadow-sm">
            <Search className="ml-3 mt-3 text-slate-400" size={20} />
            <input
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 flex-1 rounded-lg px-3 text-sm outline-none"
              placeholder="Search by SKU, brand, product, or category"
              suppressHydrationWarning
            />
            <button className="m-1 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white" suppressHydrationWarning>
              Search
            </button>
          </form>
          {query && (
            <div className="absolute left-0 right-0 top-12 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Instant results</p>
              {suggestions.map((product) => (
                <Link
                  key={product.id}
                  className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-slate-50"
                  href={`/products/${product.slug}`}
                >
                  <span>{product.name}</span>
                  <span className="text-xs text-slate-500">{product.sku}</span>
                </Link>
              ))}
              <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2">
                {categories.slice(0, 5).map((category) => (
                  <Link key={category} className="tag" href={`/category/${slugify(category)}`}>
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link className="icon-link hidden xl:flex" href="/stores" aria-label="Pickup store">
            <MapPin size={19} />
            <span>Pickup</span>
          </Link>
          <button className="icon-link hidden sm:flex" suppressHydrationWarning>EN/FR</button>
          <Link className="icon-link" href="/login" aria-label="Account">
            <UserRound size={20} />
          </Link>
          <Link className="icon-link" href="/favorites" aria-label="Favorites">
            <Heart size={20} />
          </Link>
          <Link className="icon-link relative" href="/cart" aria-label="Cart">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amber-400 text-xs font-bold text-slate-950">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto hidden max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 lg:flex">
          <PackageSearch size={18} className="text-emerald-700" />
          {categories.map((category) => (
            <Link key={category} className="category-link" href={`/category/${slugify(category)}`}>
              {category}
            </Link>
          ))}
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-4 lg:hidden">
          <form action="/products" className="mb-4 flex rounded-lg border border-slate-300">
            <input
              name="q"
              className="h-11 min-w-0 flex-1 rounded-lg px-3 text-sm outline-none"
              placeholder="Search"
              suppressHydrationWarning
            />
            <button className="px-3" suppressHydrationWarning>
              <Search size={18} />
            </button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Link key={category} className="rounded-md bg-slate-50 p-3 text-sm" href={`/category/${slugify(category)}`}>
                {category}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
