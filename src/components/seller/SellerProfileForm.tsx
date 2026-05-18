"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbSeller } from "@/lib/db";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export function SellerProfileForm({ seller }: { seller: DbSeller }) {
  const router = useRouter();
  const [form, setForm] = useState({
    storeName: seller.storeName,
    contactName: seller.contactName,
    phone: seller.phone || "",
    logoUrl: seller.logoUrl || "",
    coverUrl: seller.coverUrl || "",
    description: seller.description || "",
    returnPolicy: seller.returnPolicy || "",
    shippingDelay: seller.shippingDelay || "",
  });
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/seller/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(response.ok ? "Profil sauvegardé." : "Erreur profil.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="panel grid gap-3">
      <input className="field" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="Nom boutique" />
      <input className="field" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Contact" />
      <input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" />
      <ImageUploadField label="Logo boutique" value={form.logoUrl} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(payload) => setForm({ ...form, logoUrl: payload.url })} />
      <ImageUploadField label="Couverture boutique" value={form.coverUrl} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(payload) => setForm({ ...form, coverUrl: payload.url })} />
      <textarea className="min-h-28 rounded-md border border-slate-300 p-3 text-sm outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description boutique" />
      <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" value={form.returnPolicy} onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })} placeholder="Politique de retour" />
      <input className="field" value={form.shippingDelay} onChange={(e) => setForm({ ...form, shippingDelay: e.target.value })} placeholder="Délai livraison" />
      {message && <p className="rounded-md bg-slate-100 p-3 text-sm font-bold">{message}</p>}
      <button className="btn-primary">Sauvegarder profil</button>
    </form>
  );
}
