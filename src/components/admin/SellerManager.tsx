"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbSeller } from "@/lib/db";
import { ImageUploadField } from "./ImageUploadField";

type SellerForm = {
  id: string;
  storeName: string;
  contactName: string;
  email: string;
  password: string;
  phone: string;
  logoUrl: string;
  coverUrl: string;
  description: string;
  returnPolicy: string;
  shippingDelay: string;
  commissionRate: number;
  status: DbSeller["status"];
};

const empty: SellerForm = {
  id: "",
  storeName: "",
  contactName: "",
  email: "",
  password: "",
  phone: "",
  logoUrl: "",
  coverUrl: "",
  description: "",
  returnPolicy: "Selon les conditions du vendeur.",
  shippingDelay: "2-5 jours ouvrables",
  commissionRate: 10,
  status: "active",
};

export function SellerManager({ sellers }: { sellers: DbSeller[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SellerForm>(empty);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const url = editing.id ? `/api/admin/sellers/${editing.id}` : "/api/admin/sellers";
    const response = await fetch(url, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setMessage(response.ok ? "Vendeur sauvegardé." : "Erreur vendeur.");
    if (response.ok) {
      setEditing(empty);
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce vendeur et son compte utilisateur ?")) return;
    await fetch(`/api/admin/sellers/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function status(id: string, nextStatus: DbSeller["status"]) {
    await fetch(`/api/admin/sellers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
      <section className="panel">
        <h2 className="text-xl font-black">Vendeurs marketplace</h2>
        <div className="mt-4 grid gap-3">
          {sellers.map((seller) => (
            <article key={seller.id} className="rounded-lg border border-slate-200 p-4">
              <div className="grid gap-4 md:grid-cols-[72px_1fr_auto] md:items-center">
                <div className="relative size-16 overflow-hidden rounded-lg bg-slate-100">
                  {seller.logoUrl ? <Image src={seller.logoUrl} alt={seller.storeName} fill className="object-cover" sizes="64px" /> : <span className="grid h-full place-items-center text-xl font-black text-slate-400">{seller.storeName.slice(0, 1)}</span>}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{seller.storeName}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${seller.status === "active" ? "bg-emerald-100 text-emerald-800" : seller.status === "suspended" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{seller.status}</span>
                  </div>
                  <p className="text-sm text-slate-600">{seller.contactName} | {seller.email} | Commission {seller.commissionRate}%</p>
                  <p className="text-xs text-slate-500">Retour: {seller.returnPolicy || "N/A"} | Livraison: {seller.shippingDelay || "N/A"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => setEditing({ ...seller, password: "", phone: seller.phone || "", logoUrl: seller.logoUrl || "", coverUrl: seller.coverUrl || "", description: seller.description || "", returnPolicy: seller.returnPolicy || "", shippingDelay: seller.shippingDelay || "" })}>Modifier</button>
                  <button className="btn-secondary" onClick={() => status(seller.id, seller.status === "active" ? "suspended" : "active")}>{seller.status === "active" ? "Suspendre" : "Activer"}</button>
                  <button className="btn-secondary border-red-200 text-red-700" onClick={() => remove(seller.id)}>Supprimer</button>
                </div>
              </div>
            </article>
          ))}
          {!sellers.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucun vendeur pour le moment.</p>}
        </div>
      </section>

      <form onSubmit={submit} className="panel grid gap-3">
        <h2 className="text-xl font-black">{editing.id ? "Modifier vendeur" : "Créer vendeur"}</h2>
        <input className="field" placeholder="Nom boutique" value={editing.storeName} onChange={(e) => setEditing({ ...editing, storeName: e.target.value })} />
        <input className="field" placeholder="Nom contact" value={editing.contactName} onChange={(e) => setEditing({ ...editing, contactName: e.target.value })} />
        <input className="field" placeholder="Email connexion vendeur" type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
        <input className="field" placeholder={editing.id ? "Nouveau mot de passe optionnel" : "Mot de passe vendeur"} type="password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
        <input className="field" placeholder="Téléphone" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
        <ImageUploadField label="Logo vendeur" value={editing.logoUrl} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(payload) => setEditing({ ...editing, logoUrl: payload.url })} />
        <ImageUploadField label="Couverture vendeur" value={editing.coverUrl} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(payload) => setEditing({ ...editing, coverUrl: payload.url })} />
        <textarea className="min-h-24 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Description vendeur" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
        <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Politique retour vendeur" value={editing.returnPolicy} onChange={(e) => setEditing({ ...editing, returnPolicy: e.target.value })} />
        <input className="field" placeholder="Délai livraison" value={editing.shippingDelay} onChange={(e) => setEditing({ ...editing, shippingDelay: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" type="number" step="0.1" placeholder="Commission %" value={editing.commissionRate} onChange={(e) => setEditing({ ...editing, commissionRate: Number(e.target.value) })} />
          <select className="field" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as DbSeller["status"] })}>
            <option value="active">Actif</option>
            <option value="pending">En validation</option>
            <option value="suspended">Suspendu</option>
            <option value="rejected">Refusé</option>
          </select>
        </div>
        {message && <p className="rounded-md bg-slate-100 p-3 text-sm font-bold">{message}</p>}
        <button className="btn-primary">{editing.id ? "Sauvegarder vendeur" : "Créer vendeur"}</button>
      </form>
    </div>
  );
}
