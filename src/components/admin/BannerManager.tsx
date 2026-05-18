"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { DbBanner } from "@/lib/db";
import { ImageUploadField } from "./ImageUploadField";

type BannerForm = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  publicId: string | null;
  productImageUrl: string | null;
  productPublicId: string | null;
  productImages: { url: string; publicId?: string | null }[];
  ctaText: string;
  ctaLink: string;
  position: DbBanner["position"];
  backgroundColor: string;
  gradient: string;
  imagePosition: DbBanner["imagePosition"];
  textPosition: DbBanner["textPosition"];
  size: DbBanner["size"];
  active: number;
};

const empty: BannerForm = {
  id: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  publicId: null as string | null,
  productImageUrl: null as string | null,
  productPublicId: null as string | null,
  productImages: [],
  ctaText: "Shop now",
  ctaLink: "/products",
  position: "homepage_hero",
  backgroundColor: "#0f5132",
  gradient: "",
  imagePosition: "right",
  textPosition: "left",
  size: "large",
  active: 1,
};

export function BannerManager({ banners }: { banners: DbBanner[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(empty);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = editing.id ? `/api/admin/banners/${editing.id}` : "/api/admin/banners";
    await fetch(url, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, active: Boolean(editing.active) }),
    });
    setEditing(empty);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette bannière ?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="panel">
        <h2 className="mb-4 text-xl font-black">Bannières</h2>
        <div className="grid gap-3">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-black">{banner.title}</h3>
                  <p className="text-sm text-slate-600">{banner.position} | {banner.size} | {banner.active ? "active" : "inactive"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => setEditing({
                      ...banner,
                      productImageUrl: banner.productImageUrl || null,
                      productPublicId: banner.productPublicId || null,
                      productImages: banner.productImages?.length ? banner.productImages : banner.productImageUrl ? [{ url: banner.productImageUrl, publicId: banner.productPublicId }] : [],
                      gradient: banner.gradient || "",
                      active: banner.active ? 1 : 0,
                    })}
                  >
                    Edit
                  </button>
                  <button className="btn-secondary border-red-200 text-red-700" onClick={() => remove(banner.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <form onSubmit={submit} className="panel grid gap-3">
        <h2 className="text-xl font-black">{editing.id ? "Modifier bannière" : "Ajouter bannière"}</h2>
        <input className="field" placeholder="Titre bannière" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
        <input className="field" placeholder="Sous-titre" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
        <ImageUploadField key={`bg-${editing.id || "new"}-${editing.imageUrl}`} label="Image de fond" value={editing.imageUrl} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(payload) => setEditing({ ...editing, imageUrl: payload.url, publicId: payload.publicId || null })} />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black">Images produits de la bannière</p>
              <p className="mt-1 text-xs text-slate-500">Une seule image reste normale. Deux images ou plus deviennent déroulantes sur la homepage.</p>
            </div>
            <span className="tag">{editing.productImages.length} image(s)</span>
          </div>
          {editing.productImages.length > 0 && (
            <div className={`mb-3 gap-3 rounded-lg border border-slate-200 bg-white p-3 ${editing.productImages.length > 1 ? "flex overflow-x-auto" : "grid"}`}>
              {editing.productImages.map((image, index) => (
                <div key={`${image.url}-${index}`} className="w-56 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  <div className="relative h-32 bg-white">
                    <Image src={image.url} alt={`Image produit bannière ${index + 1}`} fill className="object-contain p-2" sizes="224px" />
                  </div>
                  <div className="grid gap-2 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-500">Image {index + 1}</span>
                      {editing.productImages.length > 1 && <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-black text-blue-800">Déroulante</span>}
                    </div>
                    <ImageUploadField
                      key={`banner-product-replace-${index}-${image.url}`}
                      label="Modifier"
                      value=""
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(payload) => {
                        const productImages = [...editing.productImages];
                        productImages[index] = { url: payload.url, publicId: payload.publicId || null };
                        setEditing({
                          ...editing,
                          productImages,
                          productImageUrl: productImages[0]?.url || null,
                          productPublicId: productImages[0]?.publicId || null,
                        });
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-black disabled:opacity-40"
                        disabled={index === 0}
                        onClick={() => {
                          const productImages = [...editing.productImages];
                          [productImages[index - 1], productImages[index]] = [productImages[index], productImages[index - 1]];
                          setEditing({ ...editing, productImages, productImageUrl: productImages[0]?.url || null, productPublicId: productImages[0]?.publicId || null });
                        }}
                      >
                        Monter
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-black disabled:opacity-40"
                        disabled={index === editing.productImages.length - 1}
                        onClick={() => {
                          const productImages = [...editing.productImages];
                          [productImages[index + 1], productImages[index]] = [productImages[index], productImages[index + 1]];
                          setEditing({ ...editing, productImages, productImageUrl: productImages[0]?.url || null, productPublicId: productImages[0]?.publicId || null });
                        }}
                      >
                        Descendre
                      </button>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-red-200 bg-white px-2 py-2 text-xs font-black text-red-700"
                      onClick={() => {
                        const productImages = editing.productImages.filter((_, itemIndex) => itemIndex !== index);
                        setEditing({ ...editing, productImages, productImageUrl: productImages[0]?.url || null, productPublicId: productImages[0]?.publicId || null });
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ImageUploadField
            key={`banner-product-add-${editing.productImages.length}`}
            label="Ajouter une image produit"
            value=""
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(payload) => {
              const productImages = [...editing.productImages, { url: payload.url, publicId: payload.publicId || null }];
              setEditing({ ...editing, productImages, productImageUrl: productImages[0]?.url || null, productPublicId: productImages[0]?.publicId || null });
            }}
          />
        </div>
        <input className="field" placeholder="CTA text" value={editing.ctaText} onChange={(e) => setEditing({ ...editing, ctaText: e.target.value })} />
        <input className="field" placeholder="CTA link" value={editing.ctaLink} onChange={(e) => setEditing({ ...editing, ctaLink: e.target.value })} />
        <div
          className="min-h-24 rounded-lg border border-slate-200 p-4 text-white shadow-inner"
          style={{
            backgroundColor: editing.backgroundColor,
            backgroundImage: editing.gradient.trim() || undefined,
          }}
        >
          <p className="text-xs font-black uppercase tracking-wide opacity-80">Aperçu couleur bannière</p>
          <p className="mt-2 text-2xl font-black">{editing.title || "Titre bannière"}</p>
          <p className="text-sm font-semibold opacity-90">{editing.subtitle || "Sous-titre promotionnel"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">
            Couleur de fond
            <div className="flex items-center gap-3">
              <input
                className="h-14 w-20 rounded-md border border-slate-300 bg-white p-2"
                type="color"
                value={editing.backgroundColor}
                onChange={(e) => setEditing({ ...editing, backgroundColor: e.target.value, gradient: "" })}
              />
              <input
                className="field"
                value={editing.backgroundColor}
                onChange={(e) => setEditing({ ...editing, backgroundColor: e.target.value, gradient: "" })}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">Changer cette couleur désactive le gradient pour que la couleur soit visible.</span>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Taille
            <select className="field" value={editing.size} onChange={(e) => setEditing({ ...editing, size: e.target.value as typeof editing.size })}>
              <option value="large">Grande</option>
              <option value="medium">Moyenne</option>
              <option value="small">Petite</option>
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold">
          Gradient optionnel
          <div className="flex gap-2">
            <input className="field" placeholder="Laisse vide pour utiliser seulement la couleur" value={editing.gradient} onChange={(e) => setEditing({ ...editing, gradient: e.target.value })} />
            <button type="button" className="btn-secondary shrink-0" onClick={() => setEditing({ ...editing, gradient: "" })}>
              Vider
            </button>
          </div>
          <span className="text-xs font-semibold text-slate-500">Si ce champ est rempli, il remplace visuellement la couleur simple.</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">
            Position image
            <select className="field" value={editing.imagePosition} onChange={(e) => setEditing({ ...editing, imagePosition: e.target.value as typeof editing.imagePosition })}>
              <option value="left">Gauche</option>
              <option value="right">Droite</option>
              <option value="center">Centre</option>
              <option value="top">Haut</option>
              <option value="bottom">Bas</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Position texte
            <select className="field" value={editing.textPosition} onChange={(e) => setEditing({ ...editing, textPosition: e.target.value as typeof editing.textPosition })}>
              <option value="left">Gauche</option>
              <option value="center">Centre</option>
              <option value="right">Droite</option>
            </select>
          </label>
        </div>
        <select className="field" value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value as typeof editing.position })}>
          <option value="homepage_hero">homepage hero</option>
          <option value="category_banner">category banner</option>
          <option value="promo_banner">promo banner</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(editing.active)} onChange={(e) => setEditing({ ...editing, active: e.target.checked ? 1 : 0 })} /> Active</label>
        <button className="btn-primary">Save banner</button>
      </form>
    </div>
  );
}
