"use client";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  sku: string;
  variantLabel?: string;
  seller: string;
};

const CART_KEY = "central_marcher_cart";
export const CART_UPDATED_EVENT = "central-marcher-cart-updated";

function readRawCart() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCartItems(): CartItem[] {
  return readRawCart().filter((item) => item?.id && item?.productId && item?.name);
}

export function saveCartItems(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addCartItem(item: CartItem) {
  const items = getCartItems();
  const existing = items.find((entry) => entry.id === item.id);
  if (existing) {
    saveCartItems(items.map((entry) => (entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry)));
    return;
  }
  saveCartItems([...items, item]);
}

export function updateCartItemQuantity(id: string, quantity: number) {
  const next = getCartItems()
    .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
    .filter((item) => item.quantity > 0);
  saveCartItems(next);
}

export function removeCartItem(id: string) {
  saveCartItems(getCartItems().filter((item) => item.id !== id));
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}
