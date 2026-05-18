"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbCategory, DbProduct } from "@/lib/db";
import { money } from "@/lib/data";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type FormState = {
  id: string;
  name: string;
  sku: string;
  price: number;
  promoPrice: number | null;
  shortDescription: string;
  description: string;
  categoryId: string;
  stock: number;
  status: DbProduct["status"];
  brand: string;
  condition: string;
  images: { url: string; publicId?: string | null; mediaType?: "image" | "video" }[];
  discountJson: string;
};

const empty: FormState = {
  id: "",
  name: "",
  sku: "",
  price: 0,
  promoPrice: null,
  shortDescription: "",
  description: "",
  categoryId: "",
  stock: 0,
  status: "draft",
  brand: "",
  condition: "New",
  images: [],
  discountJson: JSON.stringify({ enabled: false, percent: 0, badge: "SALE", startDate: "", endDate: "" }, null, 2),
};

export function SellerProductManager({ products, categories }: { products: DbProduct[]; categories: DbCategory[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FormState>(empty);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = editing.id ? `/api/seller/products/${editing.id}` : "/api/seller/products";
    const response = await fetch(url, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setMessage(response.ok ? "Produit sauvegardé." : "Erreur produit.");
    if (response.ok) {
      setEditing(empty);
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
      <section className="panel">
        <h2 className="text-xl font-black">Mes produits</h2>
        <div className="mt-4 grid gap-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-lg border border-slate-200 p-4">
              <div className="grid gap-4 md:grid-cols-[86px_1fr_auto] md:items-center">
                <div className="relative h-20 overflow-hidden rounded-md bg-slate-100">
                  {product.images[0]?.url && product.images[0].mediaType !== "video" ? <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="86px" /> : null}
                </div>
                <div>
                  <h3 className="font-black">{product.name}</h3>
                  <p className="text-sm text-slate-600">{product.sku} | {product.status} | Stock {product.stock}</p>
                  <p className="text-lg font-black">{money(product.promoPrice ?? product.price)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => setEditing({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    promoPrice: product.promoPrice,
                    shortDescription: product.shortDescription,
                    description: product.description,
                    categoryId: product.categoryId,
                    stock: product.stock,
                    status: product.status,
                    brand: product.brand,
                    condition: product.condition,
                    images: product.images.map((image) => ({ url: image.url, publicId: image.publicId, mediaType: image.mediaType })),
                    discountJson: product.discountJson || empty.discountJson,
                  })}>Modifier</button>
                  <button className="btn-secondary border-red-200 text-red-700" onClick={() => remove(product.id)}>Supprimer</button>
                </div>
              </div>
            </article>
          ))}
          {!products.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucun produit.</p>}
        </div>
      </section>
      <form onSubmit={submit} className="panel grid gap-3">
        <h2 className="text-xl font-black">{editing.id ? "Modifier produit" : "Ajouter produit"}</h2>
        <input className="field" placeholder="Nom produit" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
        <input className="field" placeholder="SKU" value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" type="number" step="0.01" placeholder="Prix" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          <input className="field" type="number" step="0.01" placeholder="Prix promo" value={editing.promoPrice ?? ""} onChange={(e) => setEditing({ ...editing, promoPrice: e.target.value ? Number(e.target.value) : null })} />
          <input className="field" type="number" placeholder="Stock" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
          <select className="field" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as DbProduct["status"] })}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <select className="field" value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
          <option value="">Catégorie</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input className="field" placeholder="Marque" value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
        <input className="field" placeholder="Condition" value={editing.condition} onChange={(e) => setEditing({ ...editing, condition: e.target.value })} />
        <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Description courte" value={editing.shortDescription} onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })} />
        <textarea className="min-h-32 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Description complète" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-black">Images / vidéos</p>
          {editing.images.length > 0 && (
            <div className="my-3 flex gap-3 overflow-x-auto">
              {editing.images.map((image, index) => (
                <div key={`${image.url}-${index}`} className="w-40 shrink-0 rounded-md border border-slate-200 bg-white p-2">
                  <div className="relative h-24 overflow-hidden rounded bg-slate-100">
                    {image.mediaType === "video" ? <video src={image.url} className="h-full w-full object-cover" muted /> : <Image src={image.url} alt="" fill className="object-cover" sizes="160px" />}
                  </div>
                  <button type="button" className="mt-2 w-full rounded-md border border-red-200 py-1 text-xs font-black text-red-700" onClick={() => setEditing({ ...editing, images: editing.images.filter((_, itemIndex) => itemIndex !== index) })}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
          <ImageUploadField label="Ajouter média" value="" onChange={(payload) => setEditing({ ...editing, images: [...editing.images, payload] })} />
        </div>
        <textarea className="min-h-24 rounded-md border border-slate-300 p-3 font-mono text-xs outline-none" placeholder="Réduction JSON" value={editing.discountJson} onChange={(e) => setEditing({ ...editing, discountJson: e.target.value })} />
        {message && <p className="rounded-md bg-slate-100 p-3 text-sm font-bold">{message}</p>}
        <button className="btn-primary">Sauvegarder</button>
      </form>
    </div>
  );
}
