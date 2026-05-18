"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { money } from "@/lib/data";
import { CART_UPDATED_EVENT, getCartItems, removeCartItem, updateCartItemQuantity, type CartItem } from "@/lib/cart";

export function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    function syncCart() {
      setItems(getCartItems());
    }
    syncCart();
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const tax = subtotal * 0.13;
  const shipping = subtotal === 0 || subtotal > 250 ? 0 : 19.99;
  const total = subtotal + tax + shipping;

  function setQuantity(id: string, quantity: number) {
    updateCartItemQuantity(id, quantity);
    setItems(getCartItems());
  }

  function remove(id: string) {
    removeCartItem(id);
    setItems(getCartItems());
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-3xl font-black">Cart</h1>
        {!items.length && (
          <div className="panel mt-5">
            <h2 className="text-xl font-black">Votre panier est vide</h2>
            <p className="mt-2 text-sm text-slate-600">Ajoutez un produit depuis une fiche produit pour le voir ici.</p>
            <Link href="/products" className="btn-primary mt-5">Continuer à magasiner</Link>
          </div>
        )}
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="panel grid gap-4 sm:grid-cols-[140px_1fr_auto]">
              <div className="relative h-32 w-full overflow-hidden rounded-md bg-slate-50">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="140px" className="object-contain p-2" />}
              </div>
              <div>
                <Link href={`/products/${item.slug}`} className="font-black hover:text-emerald-700">{item.name}</Link>
                <p className="mt-1 text-sm text-slate-600">{item.brand} | SKU {item.sku}</p>
                {item.variantLabel && <p className="mt-1 text-sm font-semibold text-emerald-700">{item.variantLabel}</p>}
                <p className="mt-1 text-sm text-slate-600">Sold and shipped by {item.seller}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex h-10 items-center overflow-hidden rounded-md border border-slate-300 bg-white">
                    <button className="grid h-10 w-10 place-items-center hover:bg-slate-50" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">
                      <Minus size={16} />
                    </button>
                    <span className="grid h-10 min-w-10 place-items-center text-sm font-black">{item.quantity}</span>
                    <button className="grid h-10 w-10 place-items-center hover:bg-slate-50" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">
                      <Plus size={16} />
                    </button>
                  </div>
                  <button className="btn-secondary border-red-200 text-red-700" onClick={() => remove(item.id)}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{money(item.price * item.quantity)}</p>
                <p className="mt-1 text-sm text-slate-500">{money(item.price)} each</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="panel h-fit">
        <h2 className="text-xl font-black">Order summary</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between"><span>Estimated taxes</span><span>{money(tax)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black"><span>Total</span><span>{money(total)}</span></div>
        </div>
        <div className="mt-5 grid gap-3">
          <input className="field" placeholder="Promo code" />
          <button className="btn-secondary">Apply code</button>
          <Link href="/checkout" className={`btn-primary h-12 ${!items.length ? "pointer-events-none opacity-50" : ""}`}>Checkout</Link>
        </div>
      </aside>
    </div>
  );
}
