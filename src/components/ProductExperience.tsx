"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, PackageCheck, Star, Truck } from "lucide-react";
import type { DbProduct } from "@/lib/db";
import { money } from "@/lib/data";
import { addCartItem } from "@/lib/cart";

type ColorVariant = {
  colorName: string;
  colorCode?: string;
  images?: string[];
  stock?: number;
  price?: number;
  available?: boolean;
  specs?: Record<string, string>;
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
  version?: number;
  attributes: VariantAttribute[];
  combinations: VariantCombination[];
};

type ProductMedia = {
  url: string;
  mediaType?: "image" | "video";
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isDiscountActive(discount: { enabled?: boolean; percent?: number; startDate?: string; endDate?: string }) {
  if (!discount.enabled || !discount.percent) return false;
  const now = new Date();
  if (discount.startDate && new Date(discount.startDate) > now) return false;
  if (discount.endDate && new Date(discount.endDate) < now) return false;
  return true;
}

function normalizeVariantConfig(value: string | null): VariantConfig {
  const parsed = parseJson<VariantConfig | ColorVariant[]>(value, { attributes: [], combinations: [] });
  if (!Array.isArray(parsed) && Array.isArray(parsed.attributes) && Array.isArray(parsed.combinations)) {
    return parsed;
  }
  if (Array.isArray(parsed)) {
    const colorAttribute: VariantAttribute = {
      id: "color",
      name: "Couleur",
      values: parsed
        .filter((item) => item.colorName)
        .map((item) => ({ id: item.colorName, label: item.colorName, colorCode: item.colorCode })),
    };
    const combinations = parsed
      .filter((item) => item.colorName)
      .map((item, index) => ({
        id: `legacy-${index}`,
        selections: { color: item.colorName },
        stock: Number(item.stock || 0),
        price: item.price,
        sku: "",
        images: item.images || [],
        available: item.available !== false,
      }));
    return colorAttribute.values.length ? { attributes: [colorAttribute], combinations } : { attributes: [], combinations: [] };
  }
  return { attributes: [], combinations: [] };
}

function selectedCombination(config: VariantConfig, selectedValues: Record<string, string>) {
  const selectedCount = Object.values(selectedValues).filter(Boolean).length;
  if (!selectedCount || selectedCount !== config.attributes.length) return null;
  return (
    config.combinations.find((combo) =>
      config.attributes.every((attribute) => combo.selections[attribute.id] === selectedValues[attribute.id]),
    ) || null
  );
}

function smartProductImage(url: string, width = 1200, height = 900) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},h_${height},c_limit/`);
}

function isVideoMedia(media: ProductMedia) {
  return media.mediaType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(media.url);
}

export function ProductExperience({ product }: { product: DbProduct }) {
  const router = useRouter();
  const variantConfig = normalizeVariantConfig(product.variantsJson);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [cartMessage, setCartMessage] = useState("");
  const activeCombination = selectedCombination(variantConfig, selectedValues);
  const shipping = parseJson(product.shippingJson, {
    visible: true,
    freeShippingEnabled: false,
    freeShippingZones: [],
    fastShippingEnabled: true,
    fastShippingPrice: 14.99,
    clientMessage: "Delivery Available",
  });
  const protection = parseJson(product.protectionJson, { enabled: false, plans: [], warrantyText: "", terms: "" });
  const marketplace = parseJson(product.marketplaceJson, { enabled: false, soldBy: "Central Marcher", sellers: [] });
  const specs = parseJson<Record<string, string>>(product.specsJson, {});
  const discount = parseJson<{ enabled?: boolean; percent?: number; badge?: string; startDate?: string; endDate?: string }>(product.discountJson, {});

  const mainGallery = product.images.map((image) => ({ url: image.url, mediaType: image.mediaType || "image" })) as ProductMedia[];
  const gallery = activeCombination?.images?.length
    ? activeCombination.images.map((url) => ({ url, mediaType: "image" as const }))
    : mainGallery;
  const [activeImage, setActiveImage] = useState(gallery[0]?.url || product.images[0]?.url || "");
  const displayedMedia = gallery.find((media) => media.url === activeImage) || gallery[0];
  const displayedImage = displayedMedia?.url || "";

  const basePrice = activeCombination?.price ?? product.promoPrice ?? product.price;
  const activeDiscount = isDiscountActive(discount);
  const finalPrice = activeDiscount ? basePrice * (1 - (discount.percent || 0) / 100) : basePrice;
  const oldPrice = activeDiscount ? basePrice : product.promoPrice ? product.price : null;
  const stock = activeCombination?.stock ?? product.stock;
  const available = stock > 0 && (!activeCombination || activeCombination.available !== false);
  const mergedSpecs = { ...specs };
  const selectedCount = Object.values(selectedValues).filter(Boolean).length;
  const variantLabel = variantConfig.attributes.map((attribute) => selectedValues[attribute.id]).filter(Boolean).join(" / ");

  const shippingText = useMemo(() => {
    if (!shipping.visible) return null;
    if (shipping.freeShippingEnabled) return shipping.clientMessage || "Free Shipping";
    if (shipping.fastShippingEnabled) return `${shipping.clientMessage || "Fast Shipping"} ${shipping.fastShippingPrice ? `- ${money(shipping.fastShippingPrice)}` : ""}`;
    return shipping.clientMessage || "Delivery Available";
  }, [shipping]);

  function handleAddToCart(redirect = false) {
    if (!available) return;
    addCartItem({
      id: `${product.id}:${activeCombination?.id || "default"}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: displayedImage,
      price: finalPrice,
      quantity: 1,
      sku: activeCombination?.sku || product.sku,
      variantLabel,
      seller: marketplace.enabled ? "Marketplace sellers" : marketplace.soldBy || "Central Marcher",
    });
    setCartMessage("Produit ajouté au panier.");
    if (redirect) router.push("/cart");
  }

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,58%)_minmax(390px,42%)]">
        <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
          <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {gallery.map((media) => (
              <button
                key={media.url}
                onClick={() => setActiveImage(media.url)}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border bg-white p-1.5 transition hover:border-emerald-400 lg:w-[86px] ${displayedImage === media.url ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-200"}`}
              >
                {isVideoMedia(media) ? (
                  <video src={media.url} className="h-full w-full object-contain p-1" muted playsInline />
                ) : (
                  <Image src={media.url} alt={product.name} fill className="object-contain p-1" sizes="96px" />
                )}
              </button>
            ))}
          </div>
          <div className="group relative order-1 flex min-h-[430px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:min-h-[560px] lg:order-2 lg:min-h-[720px] xl:min-h-[780px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(15,118,110,0.06),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
            {displayedImage && (
              <div className="absolute inset-5 flex items-center justify-center sm:inset-8 lg:inset-10">
                {displayedMedia && isVideoMedia(displayedMedia) ? (
                  <video key={displayedImage} src={displayedImage} className="h-full w-full object-contain" controls playsInline />
                ) : (
                  <Image
                    key={displayedImage}
                    src={smartProductImage(displayedImage)}
                    alt={product.name}
                    fill
                    priority
                    className="object-contain object-center transition duration-500 ease-out group-hover:scale-[1.035]"
                    sizes="(max-width:1024px) 100vw, 740px"
                  />
                )}
              </div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="flex flex-wrap gap-2">
            {activeDiscount && <span className="badge bg-amber-400 text-slate-950">{discount.badge || `-${discount.percent}%`}</span>}
            <span className="badge bg-slate-100 text-slate-700">{product.condition}</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{product.name}</h1>
          <p className="mt-2 text-sm text-slate-600">{product.brand} | SKU {product.sku}</p>
          <div className="mt-3 flex items-center gap-2">
            <Star className="fill-amber-400 text-amber-400" size={18} />
            <span className="font-bold">4.6</span>
            <span className="text-sm text-slate-500">verified product</span>
          </div>
          <div className="mt-5">
            <span className="text-4xl font-black">{money(finalPrice)}</span>
            {oldPrice && <span className="ml-3 text-lg text-slate-500 line-through">{money(oldPrice)}</span>}
          </div>

          {variantConfig.attributes.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black">Variantes disponibles</p>
                {selectedCount > 0 && (
                  <button type="button" className="text-xs font-black text-emerald-700 hover:text-emerald-900" onClick={() => setSelectedValues({})}>
                    Produit par défaut
                  </button>
                )}
              </div>
              <div className="grid gap-4">
                {variantConfig.attributes.map((attribute) => (
                  <div key={attribute.id}>
                    <p className="mb-2 text-xs font-black uppercase text-slate-500">{attribute.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value) => {
                        const selected = selectedValues[attribute.id] === value.label;
                        return (
                          <button
                            key={value.id}
                            type="button"
                            onClick={() => setSelectedValues((current) => ({ ...current, [attribute.id]: value.label }))}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition ${selected ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-white hover:border-slate-300"}`}
                          >
                            {value.colorCode && <span className="size-4 rounded-full border border-slate-300" style={{ background: value.colorCode }} />}
                            {value.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {selectedCount === variantConfig.attributes.length && !activeCombination && (
                <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">Cette combinaison n’est pas disponible.</p>
              )}
            </div>
          )}

          {shippingText && (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex gap-3">
                <Truck className="text-emerald-700" />
                <div>
                  <p className="font-bold">{shippingText}</p>
                  <p className="text-sm text-slate-600">Final shipping is recalculated at checkout with the delivery address.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex gap-3">
              <PackageCheck className="text-emerald-700" />
              <div>
                <p className="font-bold">{available ? `${stock} in stock` : "Out of stock"}</p>
                <p className="text-sm text-slate-600">
                  {activeCombination ? "Stock updates based on the selected combination." : "Default product gallery and stock are shown until a variant is selected."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary h-12 flex-1 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!available} onClick={() => handleAddToCart(false)}>Add to cart</button>
            <button className="btn-secondary h-12 flex-1" disabled={!available} onClick={() => handleAddToCart(true)}>Buy now</button>
            <button className="btn-secondary h-12" aria-label="Add to favorites"><Heart size={18} /></button>
          </div>
          {cartMessage && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{cartMessage}</p>}
          <p className="mt-4 text-sm text-slate-600">
            Sold and shipped by <strong>{marketplace.enabled ? "available sellers" : marketplace.soldBy || "Central Marcher"}</strong>
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[1fr_360px]">
        <div className="panel">
          <h2 className="text-xl font-black">Description</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{product.description}</p>
          {product.benefitsAndUsage && (
            <>
              <h3 className="mt-6 font-black">Bénéfices et conseils d’utilisation</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{product.benefitsAndUsage}</p>
            </>
          )}
          <h3 className="mt-6 font-black">Caractéristiques adaptées</h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {Object.entries(mergedSpecs).map(([key, value]) => (
                <tr key={key} className="border-t border-slate-100">
                  <th className="py-3 text-left capitalize text-slate-500">{key}</th>
                  <td className="py-3 font-semibold">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="panel h-fit">
          {protection.enabled && (
            <>
              <h2 className="text-xl font-black">Protection plan</h2>
              <p className="mt-2 text-sm text-slate-600">{protection.warrantyText}</p>
              <div className="mt-4 grid gap-3">
                {(protection.plans || []).filter((plan: { price?: number }) => Number(plan.price) > 0).map((plan: { duration: string; price: number }) => (
                  <label key={plan.duration} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <span className="font-semibold">{plan.duration}</span>
                    <span>{money(plan.price)}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{protection.terms}</p>
            </>
          )}
          {marketplace.enabled && (
            <>
              <h3 className="mt-6 font-black">Marketplace sellers</h3>
              <div className="mt-3 space-y-2 text-sm">
                {(marketplace.sellers || []).map((seller: { name: string; price?: number; rating?: number }) => (
                  <div key={seller.name} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                    <span>{seller.name} {seller.rating ? `(${seller.rating}/5)` : ""}</span>
                    <span className="font-bold">{seller.price ? money(seller.price) : money(finalPrice)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {!protection.enabled && !marketplace.enabled && (
            <p className="text-sm text-slate-600">Sold and shipped by Central Marcher.</p>
          )}
        </aside>
      </section>
    </>
  );
}
