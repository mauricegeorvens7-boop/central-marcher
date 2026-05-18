"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbCategory, DbProduct } from "@/lib/db";
import { money } from "@/lib/data";
import { ImageUploadField } from "./ImageUploadField";

type ProductForm = {
  id: string;
  name: string;
  sku: string;
  price: number;
  promoPrice: number | null;
  shortDescription: string;
  description: string;
  benefitsAndUsage: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  variantsJson: string;
  shippingJson: string;
  protectionJson: string;
  marketplaceJson: string;
  specsJson: string;
  discountJson: string;
  categoryId: string;
  stock: number;
  status: DbProduct["status"];
  brand: string;
  condition: string;
  color: string;
  size: string;
  model: string;
  images: { url: string; publicId?: string | null; mediaType?: "image" | "video" }[];
};

type JsonField = "variantsJson" | "shippingJson" | "protectionJson" | "marketplaceJson" | "specsJson" | "discountJson";

type ProductDiscount = {
  enabled: boolean;
  percent: number;
  startDate: string;
  endDate: string;
  badge: "SALE" | "FLASH SALE" | "LIMITED OFFER" | "HOT DEAL" | "NEW";
};

type ProductShipping = {
  visible: boolean;
  freeShippingEnabled: boolean;
  freeShippingZones: string[];
  fastShippingEnabled: boolean;
  fastShippingPrice: number;
  clientMessage: string;
};

type ProductProtection = {
  enabled: boolean;
  warrantyText: string;
  terms: string;
  plans: { duration: string; price: number }[];
};

type ProductMarketplace = {
  enabled: boolean;
  soldBy: string;
  sellers: { name: string; rating?: number; shippingDelay?: string; returnPolicy?: string }[];
};

type VariantAttributeValue = {
  id: string;
  label: string;
  colorCode?: string;
};

type VariantAttribute = {
  id: string;
  name: string;
  values: VariantAttributeValue[];
};

type VariantCombination = {
  id: string;
  selections: Record<string, string>;
  stock: number;
  price?: number;
  sku?: string;
  images: string[];
  available: boolean;
};

type VariantConfig = {
  version: 2;
  attributes: VariantAttribute[];
  combinations: VariantCombination[];
};

const emptyProduct: ProductForm = {
  id: "",
  name: "",
  sku: "",
  price: 0,
  promoPrice: null as number | null,
  shortDescription: "",
  description: "",
  benefitsAndUsage: "",
  seoTitle: "",
  seoDescription: "",
  keywords: "",
  variantsJson: "[]",
  shippingJson: JSON.stringify(
    {
      visible: true,
      freeShippingEnabled: false,
      freeShippingZones: [],
      fastShippingEnabled: true,
      fastShippingPrice: 14.99,
      clientMessage: "Delivery Available",
    },
    null,
    2,
  ),
  protectionJson: JSON.stringify(
    {
      enabled: false,
      warrantyText: "Selon la garantie disponible.",
      terms: "Selon les conditions du vendeur.",
      plans: [
        { duration: "1 an", price: 0 },
        { duration: "2 ans", price: 0 },
        { duration: "3 ans", price: 0 },
      ],
    },
    null,
    2,
  ),
  marketplaceJson: JSON.stringify({ enabled: false, soldBy: "Central Marcher", sellers: [] }, null, 2),
  specsJson: "{}",
  discountJson: JSON.stringify(
    {
      enabled: false,
      percent: 0,
      startDate: "",
      endDate: "",
      badge: "SALE",
    },
    null,
    2,
  ),
  categoryId: "",
  stock: 0,
  status: "draft",
  brand: "Central Market",
  condition: "New",
  color: "",
  size: "",
  model: "",
  images: [] as { url: string; publicId?: string | null; mediaType?: "image" | "video" }[],
};

const defaultDiscount: ProductDiscount = {
  enabled: false,
  percent: 0,
  startDate: "",
  endDate: "",
  badge: "SALE",
};

const defaultShipping: ProductShipping = {
  visible: true,
  freeShippingEnabled: false,
  freeShippingZones: [],
  fastShippingEnabled: true,
  fastShippingPrice: 14.99,
  clientMessage: "Delivery Available",
};

const defaultProtection: ProductProtection = {
  enabled: false,
  warrantyText: "Selon la garantie disponible.",
  terms: "Selon les conditions du vendeur.",
  plans: [
    { duration: "1 an", price: 0 },
    { duration: "2 ans", price: 0 },
    { duration: "3 ans", price: 0 },
  ],
};

const defaultMarketplace: ProductMarketplace = {
  enabled: false,
  soldBy: "Central Marcher",
  sellers: [],
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return { ...fallback, ...JSON.parse(value || "{}") };
  } catch {
    return fallback;
  }
}

function localId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyVariantConfig(): VariantConfig {
  return { version: 2, attributes: [], combinations: [] };
}

function normalizeVariantConfig(value: string): VariantConfig {
  try {
    const parsed = JSON.parse(value || "{}");
    if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.attributes) && Array.isArray(parsed.combinations)) {
      return {
        version: 2,
        attributes: parsed.attributes,
        combinations: parsed.combinations,
      };
    }

    if (Array.isArray(parsed)) {
      const colorAttribute: VariantAttribute = {
        id: "color",
        name: "Couleur",
        values: parsed
          .filter((item) => item?.colorName)
          .map((item) => ({
            id: item.colorName,
            label: item.colorName,
            colorCode: item.colorCode || "#0f766e",
          })),
      };
      const combinations: VariantCombination[] = parsed
        .filter((item) => item?.colorName)
        .map((item) => ({
          id: localId("combo"),
          selections: { [colorAttribute.id]: item.colorName },
          stock: Number(item.stock || 0),
          price: item.price,
          sku: "",
          images: item.images || [],
          available: item.available !== false,
        }));
      return colorAttribute.values.length ? { version: 2, attributes: [colorAttribute], combinations } : emptyVariantConfig();
    }
  } catch {
    return emptyVariantConfig();
  }
  return emptyVariantConfig();
}

function cartesianProduct(attributes: VariantAttribute[]) {
  const active = attributes.filter((attribute) => attribute.name.trim() && attribute.values.some((value) => value.label.trim()));
  if (!active.length) return [];
  return active.reduce<Record<string, string>[]>(
    (acc, attribute) =>
      acc.flatMap((selection) =>
        attribute.values
          .filter((value) => value.label.trim())
          .map((value) => ({ ...selection, [attribute.id]: value.label.trim() })),
      ),
    [{}],
  );
}

function selectionKey(selection: Record<string, string>) {
  return Object.entries(selection)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function combinationLabel(combo: VariantCombination, attributes: VariantAttribute[]) {
  return attributes.map((attribute) => combo.selections[attribute.id]).filter(Boolean).join(" / ");
}

function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function isDefaultProductValue(field: keyof ProductForm, current: ProductForm) {
  if (isBlank(current[field])) return true;
  if (field === "brand") return current.brand === emptyProduct.brand;
  if (field === "condition") return current.condition === emptyProduct.condition;
  if (field === "shortDescription") return current.shortDescription === emptyProduct.shortDescription;
  if (field === "description") return current.description === emptyProduct.description;
  return false;
}

function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-slate-200 bg-white p-4">
      <span>
        <span className="block text-sm font-black text-slate-950">{label}</span>
        {description && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-emerald-600" : "bg-slate-300"}`}>
        <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </label>
  );
}

function isVideoMedia(media: { url: string; mediaType?: "image" | "video" }) {
  return media.mediaType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(media.url);
}

function MediaPreview({ media, label }: { media: { url: string; mediaType?: "image" | "video" }; label: string }) {
  if (isVideoMedia(media)) {
    return <video src={media.url} className="h-full w-full object-cover" controls muted playsInline aria-label={label} />;
  }
  return <Image src={media.url} alt={label} width={260} height={140} className="h-full w-full object-cover" />;
}

export function ProductManager({ products, categories }: { products: DbProduct[]; categories: DbCategory[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProductForm>(emptyProduct);
  const [message, setMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const title = useMemo(() => (editing.id ? "Modifier produit" : "Ajouter produit"), [editing.id]);

  function edit(product: DbProduct) {
    setEditing({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      promoPrice: product.promoPrice,
      shortDescription: product.shortDescription,
      description: product.description,
      benefitsAndUsage: product.benefitsAndUsage || "",
      seoTitle: product.seoTitle || "",
      seoDescription: product.seoDescription || "",
      keywords: product.keywords || "",
      variantsJson: product.variantsJson || "[]",
      shippingJson: product.shippingJson || emptyProduct.shippingJson,
      protectionJson: product.protectionJson || emptyProduct.protectionJson,
      marketplaceJson: product.marketplaceJson || emptyProduct.marketplaceJson,
      specsJson: product.specsJson || "{}",
      discountJson: product.discountJson || emptyProduct.discountJson,
      categoryId: product.categoryId,
      stock: product.stock,
      status: product.status,
      brand: product.brand,
      condition: product.condition,
      color: product.color || "",
      size: product.size || "",
      model: product.model || "",
      images: product.images.map((image) => ({ url: image.url, publicId: image.publicId, mediaType: image.mediaType || "image" })),
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const url = editing.id ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    const response = await fetch(url, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setMessage(response.ok ? "Produit sauvegardé." : "Erreur de sauvegarde produit.");
    if (response.ok) {
      setEditing(emptyProduct);
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function generateWithAi() {
    setMessage("");
    if (!editing.name || !editing.brand || !editing.categoryId) {
      setMessage("Ajoute au moins le nom, la marque et la catégorie avant de générer avec IA.");
      return;
    }

    const category = categories.find((item) => item.id === editing.categoryId);
    setAiLoading(true);
    const response = await fetch("/api/admin/ai-generate-product-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editing.name,
        brand: editing.brand,
        price: editing.price,
        category: category?.name || "",
        shortDetails: [
          editing.shortDescription,
          editing.condition && `Condition: ${editing.condition}`,
          editing.color && `Couleur: ${editing.color}`,
          editing.size && `Taille: ${editing.size}`,
          editing.model && `Modele: ${editing.model}`,
        ]
          .filter(Boolean)
          .join("\n"),
        imageUrl: editing.images[0]?.url || "",
      }),
    });
    const data = await response.json().catch(() => ({}));
    setAiLoading(false);

    if (!response.ok) {
      setMessage(data.error || "Erreur pendant la génération IA.");
      return;
    }

    const nextSpecs =
      data.specs && typeof data.specs === "object" && !Array.isArray(data.specs)
        ? Object.fromEntries(
            Object.entries({ ...specs, ...data.specs }).filter(([, value]) => !isBlank(value)),
          )
        : specs;

    setEditing((current) => ({
      ...current,
      // L'IA complète seulement les champs vides/autorisés. Elle ne touche jamais prix,
      // promo, stock, variantes, shipping, protection, marketplace ni réduction.
      name: isBlank(current.name) && data.name ? data.name : current.name,
      sku: isBlank(current.sku) && data.sku ? data.sku : current.sku,
      brand: isDefaultProductValue("brand", current) && data.brand ? data.brand : current.brand,
      shortDescription: isDefaultProductValue("shortDescription", current) && data.shortDescription ? data.shortDescription : current.shortDescription,
      description: isDefaultProductValue("description", current) && data.fullDescription ? data.fullDescription : current.description,
      benefitsAndUsage: isBlank(current.benefitsAndUsage) && data.benefitsAndUsage ? data.benefitsAndUsage : current.benefitsAndUsage,
      seoTitle: isBlank(current.seoTitle) && data.seoTitle ? data.seoTitle : current.seoTitle,
      seoDescription: isBlank(current.seoDescription) && data.seoDescription ? data.seoDescription : current.seoDescription,
      keywords: isBlank(current.keywords) && Array.isArray(data.keywords) ? data.keywords.join(", ") : current.keywords,
      condition: isDefaultProductValue("condition", current) && data.condition ? data.condition : current.condition,
      color: isBlank(current.color) && data.color ? data.color : current.color,
      size: isBlank(current.size) && data.size ? data.size : current.size,
      model: isBlank(current.model) && data.model ? data.model : current.model,
      specsJson: Object.keys(nextSpecs).length ? JSON.stringify(nextSpecs, null, 2) : current.specsJson,
    }));
    setMessage("IA terminée. Les champs vides autorisés ont été remplis. Prix, variantes, shipping, protection, marketplace et réduction n’ont pas été modifiés.");
  }

  function applyCategoryTemplate(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId);
    const name = category?.name.toLowerCase() || "";
    const phone = name.includes("phone") || name.includes("cell") || name.includes("téléphone");
    const audio = name.includes("audio");
    const clothing = name.includes("vêtement") || name.includes("clothing") || name.includes("furniture");
    const specs = phone
      ? { couleur: "", stockage: "", ram: "", modele: "", etat: "New", batterie: "", ecran: "", reseau: "", marque: editing.brand, garantie: "Selon les conditions du vendeur" }
      : audio
        ? { couleur: "", autonomie: "", bluetooth: "", waterproof: "", noiseCancelling: "", type: "", etat: "New", garantie: "Selon les conditions du vendeur" }
        : clothing
          ? { couleur: "", taille: "", matiere: "", genre: "", coupe: "", stockParTaille: "" }
          : {};
    setEditing({ ...editing, categoryId, specsJson: JSON.stringify(specs, null, 2) });
  }

  function updateJson(field: JsonField, value: unknown) {
    setEditing((current) => ({ ...current, [field]: JSON.stringify(value, null, 2) }));
  }

  const discount = parseJson<ProductDiscount>(editing.discountJson, defaultDiscount);
  const shipping = parseJson<ProductShipping>(editing.shippingJson, defaultShipping);
  const protection = parseJson<ProductProtection>(editing.protectionJson, defaultProtection);
  const marketplace = parseJson<ProductMarketplace>(editing.marketplaceJson, defaultMarketplace);
  const variantConfig = normalizeVariantConfig(editing.variantsJson);
  const specs = parseJson<Record<string, string>>(editing.specsJson, {});
  const discountPrice = discount.enabled && discount.percent > 0
    ? Math.max(0, editing.price - editing.price * (discount.percent / 100))
    : editing.price;

  function updateDiscount(patch: Partial<ProductDiscount>) {
    updateJson("discountJson", { ...defaultDiscount, ...discount, ...patch });
  }

  function updateShipping(patch: Partial<ProductShipping>) {
    updateJson("shippingJson", { ...defaultShipping, ...shipping, ...patch });
  }

  function updateProtection(patch: Partial<ProductProtection>) {
    updateJson("protectionJson", { ...defaultProtection, ...protection, ...patch });
  }

  function updateMarketplace(patch: Partial<ProductMarketplace>) {
    updateJson("marketplaceJson", { ...defaultMarketplace, ...marketplace, ...patch });
  }

  function updateVariantConfig(config: VariantConfig) {
    updateJson("variantsJson", { ...config, version: 2 });
  }

  function addVariantAttribute() {
    updateVariantConfig({
      ...variantConfig,
      attributes: [...variantConfig.attributes, { id: localId("attr"), name: "", values: [] }],
    });
  }

  function updateVariantAttribute(index: number, patch: Partial<VariantAttribute>) {
    const attributes = [...variantConfig.attributes];
    attributes[index] = { ...attributes[index], ...patch };
    updateVariantConfig({ ...variantConfig, attributes });
  }

  function removeVariantAttribute(index: number) {
    const attributeId = variantConfig.attributes[index]?.id;
    const attributes = variantConfig.attributes.filter((_, itemIndex) => itemIndex !== index);
    const combinations = variantConfig.combinations.map((combo) => {
      const selections = { ...combo.selections };
      delete selections[attributeId];
      return { ...combo, selections };
    });
    updateVariantConfig({ ...variantConfig, attributes, combinations });
  }

  function addVariantValue(attributeIndex: number) {
    const attributes = [...variantConfig.attributes];
    attributes[attributeIndex] = {
      ...attributes[attributeIndex],
      values: [...attributes[attributeIndex].values, { id: localId("value"), label: "", colorCode: "#0f766e" }],
    };
    updateVariantConfig({ ...variantConfig, attributes });
  }

  function updateVariantValue(attributeIndex: number, valueIndex: number, patch: Partial<VariantAttributeValue>) {
    const attributes = [...variantConfig.attributes];
    const values = [...attributes[attributeIndex].values];
    values[valueIndex] = { ...values[valueIndex], ...patch };
    attributes[attributeIndex] = { ...attributes[attributeIndex], values };
    updateVariantConfig({ ...variantConfig, attributes });
  }

  function removeVariantValue(attributeIndex: number, valueIndex: number) {
    const attributes = [...variantConfig.attributes];
    const value = attributes[attributeIndex].values[valueIndex];
    attributes[attributeIndex] = {
      ...attributes[attributeIndex],
      values: attributes[attributeIndex].values.filter((_, itemIndex) => itemIndex !== valueIndex),
    };
    const combinations = variantConfig.combinations.filter((combo) => combo.selections[attributes[attributeIndex].id] !== value.label);
    updateVariantConfig({ ...variantConfig, attributes, combinations });
  }

  function generateCombinations() {
    const existing = new Map(variantConfig.combinations.map((combo) => [selectionKey(combo.selections), combo]));
    const combinations = cartesianProduct(variantConfig.attributes).map((selection) => {
      const previous = existing.get(selectionKey(selection));
      return previous || {
        id: localId("combo"),
        selections: selection,
        stock: 0,
        price: undefined,
        sku: "",
        images: [],
        available: true,
      };
    });
    updateVariantConfig({ ...variantConfig, combinations });
  }

  function updateCombination(index: number, patch: Partial<VariantCombination>) {
    const combinations = [...variantConfig.combinations];
    combinations[index] = { ...combinations[index], ...patch };
    updateVariantConfig({ ...variantConfig, combinations });
  }

  function removeCombination(index: number) {
    updateVariantConfig({ ...variantConfig, combinations: variantConfig.combinations.filter((_, itemIndex) => itemIndex !== index) });
  }

  function updateSpec(key: string, value: string) {
    updateJson("specsJson", { ...specs, [key]: value });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="panel overflow-x-auto">
        <h2 className="mb-4 text-xl font-black">Liste des produits</h2>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Produit", "SKU", "Prix", "Catégorie", "Stock", "Statut", "Actions"].map((head) => (
                <th key={head} className="p-3 font-black">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{product.name}</td>
                <td className="p-3">{product.sku}</td>
                <td className="p-3">{money(product.promoPrice ?? product.price)}</td>
                <td className="p-3">{product.categoryName}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">{product.status}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => edit(product)}>Edit</button>
                    <button className="btn-secondary border-red-200 text-red-700" onClick={() => remove(product.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <form onSubmit={submit} className="panel grid gap-3">
        <h2 className="text-xl font-black">{title}</h2>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-900">Assistant IA fiche produit</p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Génère la description, les bénéfices, les conseils d’utilisation et le SEO. Rien n’est publié sans sauvegarde admin.
              </p>
            </div>
            <button type="button" className="btn-primary shrink-0" onClick={generateWithAi} disabled={aiLoading}>
              {aiLoading ? "Génération..." : "Générer avec IA"}
            </button>
          </div>
        </div>
        <input className="field" placeholder="Nom produit" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" placeholder="SKU" value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
          <input className="field" placeholder="Brand" value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
          <input className="field" type="number" step="0.01" placeholder="Prix" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          <input className="field" type="number" step="0.01" placeholder="Prix promo" value={editing.promoPrice ?? ""} onChange={(e) => setEditing({ ...editing, promoPrice: e.target.value ? Number(e.target.value) : null })} />
          <input className="field" type="number" placeholder="Stock" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
          <select className="field" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as typeof editing.status })}>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="hidden">hidden</option>
          </select>
        </div>
        <select className="field" value={editing.categoryId} onChange={(e) => applyCategoryTemplate(e.target.value)}>
          <option value="">Catégorie</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="field" placeholder="Couleur" value={editing.color} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
          <input className="field" placeholder="Taille" value={editing.size} onChange={(e) => setEditing({ ...editing, size: e.target.value })} />
          <input className="field" placeholder="Modèle" value={editing.model} onChange={(e) => setEditing({ ...editing, model: e.target.value })} />
        </div>
        <input className="field" placeholder="Condition" value={editing.condition} onChange={(e) => setEditing({ ...editing, condition: e.target.value })} />
        <details className="rounded-lg border border-slate-200 bg-white p-3" open>
          <summary className="cursor-pointer font-black">Media</summary>
          <div className="mt-3 grid gap-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Galerie principale du produit</p>
                  <p className="mt-1 text-xs text-slate-500">Utilisée par défaut sur la page produit. Tu peux ajouter, remplacer, supprimer et faire défiler images ou vidéos.</p>
                </div>
                <span className="tag">{editing.images.length} média(s)</span>
              </div>
              {editing.images.length > 0 && (
                <div className="mb-3 flex gap-3 overflow-x-auto rounded-lg border border-slate-200 bg-white p-3">
                  {editing.images.map((image, index) => (
                    <div key={`${image.url}-${index}`} className="w-56 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      <div className="h-32 bg-white">
                        <MediaPreview media={image} label={`Média produit ${index + 1}`} />
                      </div>
                      <div className="grid gap-2 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-black uppercase text-slate-700">{isVideoMedia(image) ? "Vidéo" : "Image"}</span>
                          {index === 0 && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-800">Principal</span>}
                        </div>
                        <ImageUploadField
                          key={`replace-main-${index}-${image.url}`}
                          label="Modifier"
                          value=""
                          onChange={(payload) => {
                            const images = [...editing.images];
                            images[index] = payload;
                            setEditing({ ...editing, images });
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-black disabled:opacity-40"
                            disabled={index === 0}
                            onClick={() => {
                              const images = [...editing.images];
                              [images[index - 1], images[index]] = [images[index], images[index - 1]];
                              setEditing({ ...editing, images });
                            }}
                          >
                            Monter
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-black disabled:opacity-40"
                            disabled={index === editing.images.length - 1}
                            onClick={() => {
                              const images = [...editing.images];
                              [images[index + 1], images[index]] = [images[index], images[index + 1]];
                              setEditing({ ...editing, images });
                            }}
                          >
                            Descendre
                          </button>
                        </div>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 bg-white px-2 py-2 text-xs font-black text-red-700"
                          onClick={() => setEditing({ ...editing, images: editing.images.filter((_, itemIndex) => itemIndex !== index) })}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <ImageUploadField
                key={`main-gallery-${editing.images.length}`}
                label="Ajouter image ou vidéo principale"
                value=""
                onChange={(payload) => setEditing({ ...editing, images: [...editing.images, payload] })}
              />
            </div>
          </div>
        </details>
        <details className="rounded-lg border border-slate-200 bg-white p-3" open>
          <summary className="cursor-pointer font-black">Variants dynamiques</summary>
          <div className="mt-3 grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black">Types de variantes</p>
                  <p className="mt-1 text-xs text-slate-500">Exemples: Couleur, Stockage, RAM, Taille, Pointure, Modèle.</p>
                </div>
                <button type="button" className="btn-secondary" onClick={addVariantAttribute}>Ajouter une variante</button>
              </div>
              <div className="mt-3 grid gap-3">
                {variantConfig.attributes.map((attribute, attributeIndex) => (
                  <div key={attribute.id} className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex gap-2">
                      <input className="field flex-1" placeholder="Nom variante: Couleur, Stockage..." value={attribute.name} onChange={(e) => updateVariantAttribute(attributeIndex, { name: e.target.value })} />
                      <button type="button" className="btn-secondary border-red-200 text-red-700" onClick={() => removeVariantAttribute(attributeIndex)}>Supprimer</button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {attribute.values.map((value, valueIndex) => {
                        const isColor = attribute.name.toLowerCase().includes("couleur") || attribute.name.toLowerCase().includes("color");
                        return (
                          <div key={value.id} className="grid gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-[1fr_auto_auto]">
                            <input className="field" placeholder="Valeur: Noir, 128GB, XL..." value={value.label} onChange={(e) => updateVariantValue(attributeIndex, valueIndex, { label: e.target.value })} />
                            {isColor && (
                              <div className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-2">
                                <input className="h-7 w-9 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0" type="color" value={value.colorCode || "#0f766e"} onChange={(e) => updateVariantValue(attributeIndex, valueIndex, { colorCode: e.target.value })} aria-label="Choisir la couleur" />
                                <input className="w-24 text-xs font-bold uppercase outline-none" value={value.colorCode || "#0f766e"} onChange={(e) => updateVariantValue(attributeIndex, valueIndex, { colorCode: e.target.value })} />
                              </div>
                            )}
                            <button type="button" className="btn-secondary border-red-200 text-red-700" onClick={() => removeVariantValue(attributeIndex, valueIndex)}>Retirer</button>
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" className="btn-secondary mt-3" onClick={() => addVariantValue(attributeIndex)}>Ajouter une valeur</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black">Combinaisons</p>
                  <p className="mt-1 text-xs text-slate-500">Chaque combinaison peut avoir son stock, prix, SKU et ses images spécifiques.</p>
                </div>
                <button type="button" className="btn-primary" onClick={generateCombinations}>Générer les combinaisons</button>
              </div>
              <div className="mt-3 grid gap-3">
                {variantConfig.combinations.map((combo, comboIndex) => (
                  <div key={combo.id} className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-black">{combinationLabel(combo, variantConfig.attributes) || "Combinaison"}</p>
                        <p className="mt-1 text-xs text-slate-500">Images séparées de la galerie principale.</p>
                      </div>
                      <button type="button" className="btn-secondary border-red-200 text-red-700" onClick={() => removeCombination(comboIndex)}>Supprimer</button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input className="field" type="number" placeholder="Stock" value={combo.stock || 0} onChange={(e) => updateCombination(comboIndex, { stock: Number(e.target.value) })} />
                      <input className="field" type="number" step="0.01" placeholder="Prix spécifique optionnel" value={combo.price ?? ""} onChange={(e) => updateCombination(comboIndex, { price: e.target.value ? Number(e.target.value) : undefined })} />
                      <input className="field" placeholder="SKU spécifique optionnel" value={combo.sku || ""} onChange={(e) => updateCombination(comboIndex, { sku: e.target.value })} />
                      <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold">
                        <input type="checkbox" checked={combo.available !== false} onChange={(e) => updateCombination(comboIndex, { available: e.target.checked })} />
                        Disponible
                      </label>
                    </div>
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-black">Galerie variante</p>
                        <span className="tag">{(combo.images || []).length} image(s)</span>
                      </div>
                      {(combo.images || []).length > 0 && (
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          {(combo.images || []).map((imageUrl) => (
                            <div key={imageUrl} className="relative overflow-hidden rounded-md border border-slate-200 bg-white">
                              <Image src={imageUrl} alt="" width={260} height={140} className="h-24 w-full object-cover" />
                              <button
                                type="button"
                                className="absolute right-2 top-2 rounded-md bg-white px-2 py-1 text-xs font-black text-red-700 shadow"
                                onClick={() => updateCombination(comboIndex, { images: (combo.images || []).filter((item) => item !== imageUrl) })}
                              >
                                Retirer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <ImageUploadField
                        key={`combo-${combo.id}-${(combo.images || []).length}`}
                        label="Ajouter une image variante"
                        value=""
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(payload) => updateCombination(comboIndex, { images: [...(combo.images || []), payload.url] })}
                      />
                    </div>
                  </div>
                ))}
                {!variantConfig.combinations.length && <p className="rounded-md bg-white p-3 text-sm text-slate-500">Ajoute des types et valeurs, puis clique sur “Générer les combinaisons”.</p>}
              </div>
            </div>
          </div>
        </details>
        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-black">Shipping intelligent</summary>
          <div className="mt-3 grid gap-3">
            <Switch checked={shipping.visible} onChange={(checked) => updateShipping({ visible: checked })} label="Afficher la livraison côté client" />
            <Switch checked={shipping.freeShippingEnabled} onChange={(checked) => updateShipping({ freeShippingEnabled: checked })} label="Activer Free Shipping" description="Le client verra seulement le résultat final, pas les règles internes." />
            <input className="field" placeholder="Zones free shipping: H2X, Montreal, Laval..." value={(shipping.freeShippingZones || []).join(", ")} onChange={(e) => updateShipping({ freeShippingZones: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <Switch checked={shipping.fastShippingEnabled} onChange={(checked) => updateShipping({ fastShippingEnabled: checked })} label="Activer Fast Shipping" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" type="number" step="0.01" placeholder="Prix fast shipping" value={shipping.fastShippingPrice ?? 0} onChange={(e) => updateShipping({ fastShippingPrice: Number(e.target.value) })} />
              <input className="field" placeholder="Message client" value={shipping.clientMessage || ""} onChange={(e) => updateShipping({ clientMessage: e.target.value })} />
            </div>
          </div>
        </details>
        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-black">Protection optionnelle</summary>
          <div className="mt-3 grid gap-3">
            <Switch checked={protection.enabled} onChange={(checked) => updateProtection({ enabled: checked })} label="Afficher Protection Plan" />
            <input className="field" placeholder="Texte de garantie" value={protection.warrantyText || ""} onChange={(e) => updateProtection({ warrantyText: e.target.value })} />
            <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Conditions" value={protection.terms || ""} onChange={(e) => updateProtection({ terms: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-3">
              {(protection.plans || defaultProtection.plans).map((plan, index) => (
                <label key={plan.duration} className="grid gap-2 text-sm font-bold">
                  {plan.duration}
                  <input className="field" type="number" step="0.01" value={plan.price || 0} onChange={(e) => {
                    const plans = [...(protection.plans || defaultProtection.plans)];
                    plans[index] = { ...plan, price: Number(e.target.value) };
                    updateProtection({ plans });
                  }} />
                </label>
              ))}
            </div>
          </div>
        </details>
        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-black">Marketplace optionnel</summary>
          <div className="mt-3 grid gap-3">
            <Switch checked={marketplace.enabled} onChange={(checked) => updateMarketplace({ enabled: checked })} label="Plusieurs vendeurs marketplace" />
            <input className="field" placeholder="Vendu et expédié par" value={marketplace.soldBy || "Central Marcher"} onChange={(e) => updateMarketplace({ soldBy: e.target.value })} />
            <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              Preview client: Sold and shipped by {marketplace.enabled ? "vendeurs marketplace" : marketplace.soldBy || "Central Marcher"}
            </p>
          </div>
        </details>
        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-black">Réduction produit</summary>
          <div className="mt-3 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Switch checked={discount.enabled} onChange={(checked) => updateDiscount({ enabled: checked })} label="Activer réduction" description="Affiche automatiquement l’ancien prix barré, le nouveau prix et le badge." />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Pourcentage
                <div className="flex overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                  <input className="h-11 min-w-0 flex-1 px-3 text-sm outline-none" type="number" min="0" max="95" value={discount.percent || 0} onChange={(e) => updateDiscount({ percent: Number(e.target.value) })} />
                  <span className="flex h-11 items-center border-l border-slate-200 px-3 text-sm font-black text-slate-500">%</span>
                </div>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Badge
                <select className="field" value={discount.badge || "SALE"} onChange={(e) => updateDiscount({ badge: e.target.value as ProductDiscount["badge"] })}>
                  {["SALE", "FLASH SALE", "LIMITED OFFER", "HOT DEAL", "NEW"].map((badge) => <option key={badge} value={badge}>{badge}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Date début
                <input className="field" type="date" value={discount.startDate || ""} onChange={(e) => updateDiscount({ startDate: e.target.value })} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Date fin
                <input className="field" type="date" value={discount.endDate || ""} onChange={(e) => updateDiscount({ endDate: e.target.value })} />
              </label>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white p-4">
              <p className="text-xs font-black uppercase text-emerald-700">Preview prix</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <span className={discount.enabled ? "text-xl font-black text-slate-400 line-through" : "text-xl font-black text-slate-950"}>{money(editing.price || 0)}</span>
                {discount.enabled && <span className="text-3xl font-black text-emerald-700">{money(discountPrice)}</span>}
                {discount.enabled && <span className="badge bg-rose-600 text-white">{discount.badge}</span>}
              </div>
            </div>
          </div>
        </details>
        <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Description courte" value={editing.shortDescription} onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })} />
        <label className="grid gap-2 text-sm font-bold">
          Description complète du produit
          <textarea className="min-h-36 rounded-md border border-slate-300 p-3 text-sm font-normal outline-none" placeholder="Description complète" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Bénéfices + conseils d’utilisation
          <textarea className="min-h-36 rounded-md border border-slate-300 p-3 text-sm font-normal outline-none" placeholder="Bénéfices, conseils, précautions et limites raisonnables" value={editing.benefitsAndUsage} onChange={(e) => setEditing({ ...editing, benefitsAndUsage: e.target.value })} />
        </label>
        <div className="grid gap-3">
          <input className="field" placeholder="SEO title" value={editing.seoTitle} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} />
          <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="SEO description" value={editing.seoDescription} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} />
          <input className="field" placeholder="Keywords séparés par virgule" value={editing.keywords} onChange={(e) => setEditing({ ...editing, keywords: e.target.value })} />
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-3 text-sm font-black">Spécifications techniques</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(specs).map(([key, value]) => (
                <label key={key} className="grid gap-2 text-sm font-bold capitalize">
                  {key}
                  <input className="field" value={String(value)} onChange={(e) => updateSpec(key, e.target.value)} />
                </label>
              ))}
              {!Object.keys(specs).length && <p className="text-sm text-slate-500">Choisis une catégorie pour afficher les champs adaptés.</p>}
            </div>
          </div>
        </div>
        {message && <p className="rounded-md bg-slate-100 p-3 text-sm font-semibold">{message}</p>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1">Save</button>
          <button type="button" className="btn-secondary" onClick={() => setEditing(emptyProduct)}>Reset</button>
        </div>
      </form>
    </div>
  );
}
