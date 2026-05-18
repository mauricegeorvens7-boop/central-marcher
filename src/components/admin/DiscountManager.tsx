"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbDiscount } from "@/lib/db";
import { money } from "@/lib/data";

type DiscountForm = {
  id: string;
  name: string;
  type: string;
  enabled: number;
  percent: number | null;
  badge: string;
  code: string;
  startDate: string;
  endDate: string;
  newCustomerDays: number | null;
  minAmount: number | null;
  categoriesJson: string;
  excludedProductsJson: string;
};

const empty: DiscountForm = {
  id: "",
  name: "",
  type: "product",
  enabled: 1,
  percent: null,
  badge: "SALE",
  code: "",
  startDate: "",
  endDate: "",
  newCustomerDays: null,
  minAmount: null,
  categoriesJson: "[]",
  excludedProductsJson: "[]",
};

export function DiscountManager({ discounts }: { discounts: DbDiscount[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<DiscountForm>(empty);
  const [message, setMessage] = useState("");

  function edit(discount: DbDiscount) {
    setEditing({
      id: discount.id,
      name: discount.name,
      type: discount.type,
      enabled: discount.enabled,
      percent: discount.percent,
      badge: discount.badge || "",
      code: discount.code || "",
      startDate: discount.startDate || "",
      endDate: discount.endDate || "",
      newCustomerDays: discount.newCustomerDays,
      minAmount: discount.minAmount,
      categoriesJson: discount.categoriesJson || "[]",
      excludedProductsJson: discount.excludedProductsJson || "[]",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const url = editing.id ? `/api/admin/discounts/${editing.id}` : "/api/admin/discounts";
    const response = await fetch(url, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, enabled: Boolean(editing.enabled) }),
    });
    setMessage(response.ok ? "Réduction sauvegardée." : "Erreur réduction.");
    if (response.ok) {
      setEditing(empty);
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette réduction ?")) return;
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="panel overflow-x-auto">
        <h2 className="mb-4 text-xl font-black">Réductions actives et programmées</h2>
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>{["Nom", "Type", "%", "Badge", "Expiration", "Usages", "Revenus", "Actions"].map((h) => <th key={h} className="p-3 font-black">{h}</th>)}</tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{discount.name} {!discount.enabled && <span className="tag ml-2">inactive</span>}</td>
                <td className="p-3">{discount.type}</td>
                <td className="p-3">{discount.percent ?? 0}%</td>
                <td className="p-3">{discount.badge}</td>
                <td className="p-3">{discount.endDate || "no limit"}</td>
                <td className="p-3">{discount.usageCount}</td>
                <td className="p-3">{money(discount.revenueGenerated)}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => edit(discount)}>Edit</button>
                    <button className="btn-secondary border-red-200 text-red-700" onClick={() => remove(discount.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <form onSubmit={submit} className="panel grid gap-3">
        <h2 className="text-xl font-black">{editing.id ? "Modifier réduction" : "Créer réduction"}</h2>
        <input className="field" placeholder="Nom" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
        <select className="field" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
          <option value="product">réduction produit</option>
          <option value="category">réduction catégorie</option>
          <option value="global">réduction globale</option>
          <option value="new_customer">nouveaux clients</option>
          <option value="limited_time">limitée dans le temps</option>
          <option value="flash_sale">flash sale</option>
          <option value="promo_code">code promo manuel</option>
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" type="number" placeholder="Pourcentage" value={editing.percent ?? ""} onChange={(e) => setEditing({ ...editing, percent: e.target.value ? Number(e.target.value) : null })} />
          <input className="field" placeholder="Badge promo" value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} />
          <input className="field" placeholder="Code promo" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
          <input className="field" type="number" placeholder="Montant minimum" value={editing.minAmount ?? ""} onChange={(e) => setEditing({ ...editing, minAmount: e.target.value ? Number(e.target.value) : null })} />
          <input className="field" type="date" value={editing.startDate} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
          <input className="field" type="date" value={editing.endDate} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} />
        </div>
        <input className="field" type="number" placeholder="Jours nouveaux clients" value={editing.newCustomerDays ?? ""} onChange={(e) => setEditing({ ...editing, newCustomerDays: e.target.value ? Number(e.target.value) : null })} />
        <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" value={editing.categoriesJson} onChange={(e) => setEditing({ ...editing, categoriesJson: e.target.value })} placeholder='Catégories concernées JSON ex: ["Audio"]' />
        <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" value={editing.excludedProductsJson} onChange={(e) => setEditing({ ...editing, excludedProductsJson: e.target.value })} placeholder='Produits exclus JSON ex: ["sku-1"]' />
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(editing.enabled)} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked ? 1 : 0 })} /> Active</label>
        {message && <p className="rounded-md bg-slate-100 p-3 text-sm font-semibold">{message}</p>}
        <button className="btn-primary">Save discount</button>
      </form>
    </div>
  );
}
