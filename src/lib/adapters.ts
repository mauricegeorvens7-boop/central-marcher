import { DbProduct } from "@/lib/db";
import { Product } from "@/lib/data";

export function dbProductToProduct(product: DbProduct): Product {
  const discount = (() => {
    if (!product.discountJson) return null;
    try {
      return JSON.parse(product.discountJson) as { enabled?: boolean; percent?: number; startDate?: string; endDate?: string; badge?: string };
    } catch {
      return null;
    }
  })();
  const discountActive = (() => {
    if (!discount?.enabled || !discount.percent) return false;
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) return false;
    if (discount.endDate && new Date(discount.endDate) < now) return false;
    return true;
  })();
  const basePrice = product.promoPrice ?? product.price;
  const currentPrice = discountActive ? basePrice * (1 - (discount?.percent || 0) / 100) : basePrice;
  const imageUrls = product.images.filter((image) => image.mediaType !== "video").map((image) => image.url);
  const fallbackImage = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80";
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.categoryName,
    image: imageUrls[0] || fallbackImage,
    images: imageUrls.length ? imageUrls : [fallbackImage],
    price: currentPrice,
    oldPrice: discountActive ? basePrice : product.promoPrice ? product.price : undefined,
    rating: 4.6,
    reviews: 128,
    condition: product.condition as Product["condition"],
    color: product.color || "Default",
    stock: product.stock,
    seller: "Central Market",
    sellerRating: 4.9,
    online: product.stock > 0,
    pickup: product.stock > 0,
    freeShipping: currentPrice > 250,
    badge: discountActive ? discount?.badge || `-${discount?.percent}%` : product.promoPrice ? "Sale" : product.condition !== "New" ? "Open Box" : undefined,
    features: [product.shortDescription, product.brand, product.condition, `${product.stock} in stock`],
    specs: {
      Brand: product.brand,
      SKU: product.sku,
      Category: product.categoryName,
      Condition: product.condition,
    },
    included: ["Product", "Documentation"],
    description: product.benefitsAndUsage
      ? `${product.description}\n\nBenefits and usage: ${product.benefitsAndUsage}`
      : product.description,
  };
}
