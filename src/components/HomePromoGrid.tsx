import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { DbBanner } from "@/lib/db";

function bannerBuckets(banners: DbBanner[]) {
  const heroBanners = banners.filter((banner) => banner.position === "homepage_hero" && banner.active);
  const large = heroBanners.find((banner) => banner.size === "large") || heroBanners[0];
  const medium = heroBanners.find((banner) => banner.id !== large?.id && banner.size === "medium") || heroBanners.find((banner) => banner.id !== large?.id);
  const small = heroBanners.filter((banner) => banner.id !== large?.id && banner.id !== medium?.id).slice(0, 2);
  return [large, medium, ...small].filter(Boolean) as DbBanner[];
}

function textAlignClass(position: DbBanner["textPosition"]) {
  if (position === "center") return "items-center text-center";
  if (position === "right") return "items-end text-right";
  return "items-start text-left";
}

function imagePositionClass(position: DbBanner["imagePosition"]) {
  const map = {
    left: "left-4 top-1/2 -translate-y-1/2",
    right: "right-4 top-1/2 -translate-y-1/2",
    center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    top: "left-1/2 top-4 -translate-x-1/2",
    bottom: "bottom-4 left-1/2 -translate-x-1/2",
  };
  return map[position];
}

function sizeClass(size: DbBanner["size"]) {
  if (size === "large") return "min-h-[460px] lg:row-span-2";
  if (size === "medium") return "min-h-[220px] lg:col-span-2";
  return "min-h-[210px]";
}

function productImageClass(size: DbBanner["size"]) {
  if (size === "large") return "max-h-[48%] max-w-[68%] md:max-h-[44%]";
  if (size === "medium") return "max-h-[74%] max-w-[50%]";
  return "max-h-[46%] max-w-[72%]";
}

function productImagesForBanner(banner: DbBanner) {
  return banner.productImages?.length
    ? banner.productImages
    : banner.productImageUrl
      ? [{ url: banner.productImageUrl, publicId: banner.productPublicId }]
      : [];
}

function PromoTile({ banner }: { banner: DbBanner }) {
  const backgroundImage = [banner.gradient, banner.imageUrl ? `url(${banner.imageUrl})` : ""].filter(Boolean).join(", ");
  const productImages = productImagesForBanner(banner);
  const style: CSSProperties = {
    backgroundColor: banner.backgroundColor,
    backgroundImage,
    backgroundSize: banner.imageUrl ? "cover" : undefined,
    backgroundPosition: "center",
  };

  return (
    <article className={`group relative overflow-hidden rounded-md p-6 text-white shadow-sm ${sizeClass(banner.size)}`} style={style}>
      <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />
      {productImages.length === 1 && (
        <Image
          src={productImages[0].url}
          alt=""
          width={640}
          height={420}
          priority={banner.size === "large"}
          className={`pointer-events-none absolute z-10 h-auto w-auto object-contain drop-shadow-2xl transition duration-300 group-hover:scale-[1.03] ${imagePositionClass(banner.imagePosition)} ${productImageClass(banner.size)}`}
        />
      )}
      {productImages.length > 1 && (
        <div className={`pointer-events-none absolute z-10 flex w-[78%] gap-5 overflow-hidden ${imagePositionClass(banner.imagePosition)}`}>
          <div className="flex min-w-full animate-[banner-products_14s_linear_infinite] gap-5">
            {[...productImages, ...productImages].map((image, index) => (
              <Image
                key={`${image.url}-${index}`}
                src={image.url}
                alt=""
                width={420}
                height={320}
                priority={banner.size === "large" && index === 0}
                className={`h-auto w-auto shrink-0 object-contain drop-shadow-2xl ${productImageClass(banner.size)}`}
              />
            ))}
          </div>
        </div>
      )}
      <div className={`relative z-20 flex h-full flex-col justify-end gap-4 ${textAlignClass(banner.textPosition)}`}>
        <div className={banner.size === "large" ? "max-w-xl" : "max-w-md"}>
          <h1 className={banner.size === "large" ? "text-4xl font-black leading-tight md:text-5xl" : "text-2xl font-black leading-tight md:text-3xl"}>
            {banner.title}
          </h1>
          <p className="mt-3 text-base font-semibold leading-7 text-white/95 md:text-lg">{banner.subtitle}</p>
        </div>
        <Link href={banner.ctaLink} className="inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-amber-50">
          {banner.ctaText}
        </Link>
      </div>
    </article>
  );
}

export function HomePromoGrid({ banners }: { banners: DbBanner[] }) {
  const tiles = bannerBuckets(banners);
  if (!tiles.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          {tiles[0] && <PromoTile banner={tiles[0]} />}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tiles[1] && <PromoTile banner={tiles[1]} />}
          {tiles.slice(2).map((banner) => (
            <PromoTile key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
}
