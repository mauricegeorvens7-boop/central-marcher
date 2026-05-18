"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Smartphone, Truck, Wallet } from "lucide-react";
import { money } from "@/lib/data";
import { getCartItems, saveCartItems, type CartItem } from "@/lib/cart";
import type { PaymentSettings } from "@/lib/db";

type Method = "stripe" | "moncash" | "natcash" | "cash_on_delivery" | "balance";

function defaultMethod(settings: PaymentSettings, hasUser: boolean): Method {
  if (settings.moncashEnabled) return "moncash";
  if (settings.natcashEnabled) return "natcash";
  if (hasUser) return "balance";
  if (settings.cashOnDeliveryEnabled) return "cash_on_delivery";
  return "stripe";
}

export function CheckoutClient({
  settings,
  user,
  defaultAddress,
}: {
  settings: PaymentSettings;
  user: { name: string; email: string; phone: string; balance: number } | null;
  defaultAddress: { line1: string; city: string; province: string; postalCode: string; phone: string } | null;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<Method>(() => defaultMethod(settings, Boolean(user)));
  const [proof, setProof] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || defaultAddress?.phone || "",
    address: defaultAddress?.line1 || "",
    city: defaultAddress?.city || "",
    province: defaultAddress?.province || "",
    postalCode: defaultAddress?.postalCode || "",
    payerPhone: "",
    amountSent: "",
  });

  useEffect(() => {
    queueMicrotask(() => setItems(getCartItems()));
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const shipping = subtotal === 0 || subtotal > 250 ? 0 : 19.99;
  const discount = 0;
  const total = subtotal + shipping - discount;
  const tax = total * 0.13;
  const finalTotal = total + tax;
  const manualNumber = method === "moncash" ? settings.moncashNumber : settings.natcashNumber;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!items.length) return setMessage("Votre panier est vide.");
    const missing = [
      !form.name.trim() && "nom complet",
      !form.email.trim() && "email",
      !form.phone.trim() && "téléphone",
      !form.address.trim() && "adresse",
      !form.city.trim() && "ville",
    ].filter(Boolean);
    if (missing.length) return setMessage(`Complète ces champs avant de continuer : ${missing.join(", ")}.`);
    if ((method === "moncash" || method === "natcash") && (!proof || !form.payerPhone || !form.amountSent)) return setMessage("Ajoute la preuve, le montant envoyé et le numéro utilisé.");
    if (method === "balance" && (!user || user.balance < finalTotal)) return setMessage("Solde insuffisant. Recharge ton compte avec MonCash ou NatCash.");

    const data = new FormData();
    data.set("method", method);
    data.set("customerName", form.name);
    data.set("customerEmail", form.email);
    data.set("customerPhone", form.phone);
    data.set("amount", String(method === "moncash" || method === "natcash" ? Number(form.amountSent) : finalTotal));
    data.set("orderTotal", String(finalTotal));
    data.set("payerPhone", form.payerPhone);
    data.set("items", JSON.stringify(items));
    data.set("shippingAddress", `${form.address}, ${form.city}, ${form.province}, ${form.postalCode}`);
    if (proof) data.set("proof", proof);

    setLoading(true);
    const response = await fetch("/api/checkout", { method: "POST", body: data });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Erreur checkout.");
    saveCartItems([]);
    setItems([]);
    setMessage(method === "moncash" || method === "natcash" ? "Commande créée. Paiement en attente de validation admin." : "Commande confirmée.");
  }

  const steps = ["Contact", "Livraison", "Paiement", "Vérification", "Confirmation"];

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Checkout</h1>
        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step} className="rounded-md bg-white p-3 text-sm font-black shadow-sm">
              <span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-emerald-600 text-xs text-white">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        <section className="space-y-5">
          <div className="panel">
            <h2 className="text-xl font-black">Contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input className="field" placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input className="field" placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>

          <div className="panel">
            <h2 className="text-xl font-black">Livraison</h2>
            <div className="mt-4 grid gap-3">
              <input className="field" placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="field" placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                <input className="field" placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
                <input className="field" placeholder="Code postal" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="panel">
            <h2 className="text-xl font-black">Paiement</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {([
                ["stripe", "Carte bancaire / Stripe", null, true],
                ["moncash", "MonCash", Smartphone, Boolean(settings.moncashEnabled)],
                ["natcash", "NatCash", Smartphone, Boolean(settings.natcashEnabled)],
                ["balance", `Solde du compte (${money(user?.balance || 0)})`, Wallet, Boolean(user)],
                ["cash_on_delivery", "Paiement à la livraison", Truck, Boolean(settings.cashOnDeliveryEnabled)],
              ] as [Method, string, LucideIcon | null, boolean][]).map(([value, label, Icon, enabled]) => (
                <button
                  key={String(value)}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setMethod(value as Method)}
                  className={`flex items-center gap-3 rounded-md border p-4 text-left font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${method === value ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  suppressHydrationWarning
                >
                  {value === "stripe" ? (
                    <span className="relative h-9 w-16 overflow-hidden rounded bg-white shadow-sm ring-1 ring-slate-200">
                      <Image src="/credit-card-payment.png" alt="Carte bancaire" fill className="object-cover" sizes="64px" />
                    </span>
                  ) : value === "moncash" ? (
                    <span className="relative h-7 w-16 overflow-hidden rounded bg-white">
                      <Image src="/moncash-logo.png" alt="MonCash" fill className="object-contain" sizes="64px" />
                    </span>
                  ) : value === "natcash" ? (
                    <span className="relative h-7 w-16 overflow-hidden rounded bg-white">
                      <Image src="/natcash-logo.svg" alt="NatCash" fill className="object-contain" sizes="64px" />
                    </span>
                  ) : value === "balance" ? (
                    <span className="relative size-8 overflow-hidden rounded bg-white">
                      <Image src="/account-balance-wallet.svg" alt="Solde du compte" fill className="object-contain" sizes="32px" />
                    </span>
                  ) : (
                    Icon && <Icon size={20} />
                  )}
                  {String(label)}
                </button>
              ))}
            </div>

            {(method === "moncash" || method === "natcash") && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  {method === "moncash" && (
                    <span className="relative h-9 w-24 overflow-hidden rounded bg-white">
                      <Image src="/moncash-logo.png" alt="MonCash" fill className="object-contain" sizes="96px" />
                    </span>
                  )}
                  {method === "natcash" && (
                    <span className="relative h-9 w-24 overflow-hidden rounded bg-white">
                      <Image src="/natcash-logo.svg" alt="NatCash" fill className="object-contain" sizes="96px" />
                    </span>
                  )}
                  <h3 className="font-black">Instructions {method === "moncash" ? "MonCash" : "NatCash"}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-700">Envoyez le paiement au numéro suivant, puis soumettez la preuve. L’admin doit valider avant que la commande soit payée.</p>
                <p className="mt-3 rounded-md bg-white p-3 text-xl font-black">{manualNumber || "Numéro non configuré"}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input className="field" type="number" step="0.01" placeholder="Montant envoyé" value={form.amountSent} onChange={(e) => setForm({ ...form, amountSent: e.target.value })} />
                  <input className="field" placeholder="Numéro utilisé pour payer" value={form.payerPhone} onChange={(e) => setForm({ ...form, payerPhone: e.target.value })} />
                  <input className="field pt-2 sm:col-span-2" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setProof(e.target.files?.[0] || null)} />
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <h2 className="text-xl font-black">Vérification</h2>
            <p className="mt-2 text-sm text-slate-600">Vérifie tes informations. Les paiements manuels restent en attente jusqu’à validation admin.</p>
            {message && <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm font-bold">{message}</p>}
            <button className="btn-primary mt-5 h-12 w-full" disabled={loading} suppressHydrationWarning>{loading ? "Traitement..." : method === "moncash" || method === "natcash" ? "Soumettre la preuve de paiement" : "Placer la commande"}</button>
          </div>
        </section>

        <aside className="panel h-fit lg:sticky lg:top-28">
          <h2 className="text-xl font-black">Résumé commande</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-md bg-slate-50 p-3">
                <div className="relative size-16 overflow-hidden rounded-md bg-white">
                  {item.image && <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="64px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-black">{item.name}</p>
                  <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-black">{money(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span>Total produit</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>Livraison</span><span>{shipping ? money(shipping) : "Free"}</span></div>
            <div className="flex justify-between"><span>Réduction</span><span>-{money(discount)}</span></div>
            <div className="flex justify-between"><span>Taxes estimées</span><span>{money(tax)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black"><span>Total final</span><span>{money(finalTotal)}</span></div>
          </div>
          <div className="mt-5 flex gap-2 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
            <CheckCircle2 size={18} /> Transactions manuelles validées seulement par l’admin.
          </div>
          <Link href="/cart" className="btn-secondary mt-4 w-full">Modifier le panier</Link>
        </aside>
      </div>
    </form>
  );
}
