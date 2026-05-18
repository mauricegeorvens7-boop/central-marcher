export type Condition = "New" | "Open Box Excellent" | "Open Box Good" | "Refurbished";

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  images: string[];
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  condition: Condition;
  color: string;
  stock: number;
  seller: string;
  sellerRating: number;
  online: boolean;
  pickup: boolean;
  freeShipping: boolean;
  badge?: string;
  features: string[];
  specs: Record<string, string>;
  included: string[];
  description: string;
};

export const categories = [
  "Electronics",
  "Computers & Tablets",
  "Cell Phones",
  "TV & Home Theater",
  "Appliances",
  "Gaming",
  "Audio",
  "Cameras",
  "Smart Home",
  "Beauty & Health",
  "Furniture",
  "Open Box",
  "Deals",
];

export const stores = [
  {
    id: "store-toronto",
    name: "Central Market Toronto",
    city: "Toronto",
    address: "120 King Street W",
    phone: "+1 416 555 0198",
    hours: "Mon-Sat 9:00-21:00, Sun 10:00-18:00",
  },
  {
    id: "store-montreal",
    name: "Central Market Montreal",
    city: "Montreal",
    address: "88 Sainte-Catherine O",
    phone: "+1 514 555 0164",
    hours: "Mon-Sat 9:00-20:00, Sun 10:00-17:00",
  },
  {
    id: "store-vancouver",
    name: "Central Market Vancouver",
    city: "Vancouver",
    address: "450 Granville Street",
    phone: "+1 604 555 0147",
    hours: "Mon-Sat 9:00-21:00, Sun 10:00-18:00",
  },
];

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const products: Product[] = [
  {
    id: "p1",
    slug: "aurora-x1-ultrabook",
    sku: "AUR-X1-512",
    name: "Aurora X1 14-inch OLED Ultrabook",
    brand: "Northstar",
    category: "Computers & Tablets",
    image: img("photo-1496181133206-80ce9b88a853"),
    images: [
      img("photo-1496181133206-80ce9b88a853"),
      img("photo-1517336714731-489689fd1ca8"),
      img("photo-1541807084-5c52b6b3adef"),
    ],
    price: 1199.99,
    oldPrice: 1499.99,
    rating: 4.7,
    reviews: 428,
    condition: "New",
    color: "Graphite",
    stock: 42,
    seller: "Central Market",
    sellerRating: 4.9,
    online: true,
    pickup: true,
    freeShipping: true,
    badge: "Sale",
    features: ["Intel Core Ultra 7", "16GB memory", "512GB SSD", "2.8K OLED display"],
    specs: { Display: "14-inch OLED", Memory: "16GB", Storage: "512GB SSD", Weight: "1.2 kg" },
    included: ["Laptop", "USB-C charger", "Quick start guide"],
    description: "A thin premium notebook for work, media, and travel with all-day battery life.",
  },
  {
    id: "p2",
    slug: "vista-65-qled-tv",
    sku: "VIS-65Q-2026",
    name: "Vista 65-inch QLED 4K Smart TV",
    brand: "Lumio",
    category: "TV & Home Theater",
    image: img("photo-1593784991095-a205069470b6"),
    images: [img("photo-1593784991095-a205069470b6"), img("photo-1601944179066-29786cb9d32a")],
    price: 899.99,
    oldPrice: 1199.99,
    rating: 4.6,
    reviews: 812,
    condition: "New",
    color: "Black",
    stock: 18,
    seller: "Vision Depot",
    sellerRating: 4.6,
    online: true,
    pickup: true,
    freeShipping: true,
    badge: "Deal",
    features: ["4K QLED panel", "120Hz refresh", "Dolby Vision", "Voice remote"],
    specs: { Size: "65 inch", Resolution: "3840 x 2160", HDR: "Dolby Vision", Inputs: "4 HDMI" },
    included: ["TV", "Remote", "Stand", "Power cable"],
    description: "Bright, fluid entertainment for movies, sport, and next-gen consoles.",
  },
  {
    id: "p3",
    slug: "pulsebuds-pro",
    sku: "PBP-WHT-02",
    name: "PulseBuds Pro Noise Cancelling Earbuds",
    brand: "Sonicwell",
    category: "Audio",
    image: img("photo-1606220945770-b5b6c2c55bf1"),
    images: [img("photo-1606220945770-b5b6c2c55bf1"), img("photo-1590658268037-6bf12165a8df")],
    price: 149.99,
    oldPrice: 219.99,
    rating: 4.5,
    reviews: 1320,
    condition: "Open Box Excellent",
    color: "White",
    stock: 67,
    seller: "Central Market",
    sellerRating: 4.9,
    online: true,
    pickup: true,
    freeShipping: false,
    badge: "Open Box",
    features: ["Adaptive ANC", "30-hour case battery", "Wireless charging", "IPX4 splash resistance"],
    specs: { Battery: "30 hours", Bluetooth: "5.4", Charging: "USB-C / Qi", Microphones: "6" },
    included: ["Earbuds", "Charging case", "Ear tips", "USB-C cable"],
    description: "Compact earbuds with clean calls, strong noise control, and reduced open-box pricing.",
  },
  {
    id: "p4",
    slug: "pixelcraft-phone-8",
    sku: "PC8-256-BLK",
    name: "PixelCraft Phone 8 256GB",
    brand: "PixelCraft",
    category: "Cell Phones",
    image: img("photo-1511707171634-5f897ff02aa9"),
    images: [img("photo-1511707171634-5f897ff02aa9"), img("photo-1598327105666-5b89351aff97")],
    price: 779.99,
    rating: 4.8,
    reviews: 599,
    condition: "New",
    color: "Obsidian",
    stock: 25,
    seller: "Mobile Avenue",
    sellerRating: 4.7,
    online: true,
    pickup: false,
    freeShipping: true,
    features: ["6.3-inch adaptive display", "AI camera tools", "256GB storage", "Fast wired charging"],
    specs: { Storage: "256GB", Display: "6.3 inch", Camera: "50MP wide", Network: "5G" },
    included: ["Phone", "USB-C cable", "SIM tool"],
    description: "A fast flagship phone with smart photography and a clean software experience.",
  },
  {
    id: "p5",
    slug: "forgebox-series-g",
    sku: "FBG-1TB",
    name: "ForgeBox Series G Console 1TB",
    brand: "Forge",
    category: "Gaming",
    image: img("photo-1606813907291-d86efa9b94db"),
    images: [img("photo-1606813907291-d86efa9b94db"), img("photo-1621259182978-fbf93132d53d")],
    price: 499.99,
    rating: 4.9,
    reviews: 2180,
    condition: "New",
    color: "Carbon",
    stock: 12,
    seller: "Central Market",
    sellerRating: 4.9,
    online: true,
    pickup: true,
    freeShipping: true,
    badge: "Best Seller",
    features: ["4K gaming", "1TB SSD", "Ray tracing", "Wireless controller"],
    specs: { Storage: "1TB SSD", Output: "4K 120Hz", Controller: "Included", Network: "Wi-Fi 6" },
    included: ["Console", "Controller", "HDMI cable", "Power cable"],
    description: "A powerful console for fast load times, cinematic titles, and multiplayer nights.",
  },
  {
    id: "p6",
    slug: "habitat-robot-vacuum",
    sku: "HAB-RV-MAP",
    name: "Habitat Mapping Robot Vacuum",
    brand: "Habitat",
    category: "Smart Home",
    image: img("photo-1567690187548-f07b1d7bf5a9"),
    images: [img("photo-1567690187548-f07b1d7bf5a9"), img("photo-1581578731548-c64695cc6952")],
    price: 329.99,
    oldPrice: 449.99,
    rating: 4.3,
    reviews: 340,
    condition: "Refurbished",
    color: "White",
    stock: 31,
    seller: "RenewTech",
    sellerRating: 4.4,
    online: true,
    pickup: false,
    freeShipping: true,
    badge: "Refurbished",
    features: ["Room mapping", "App schedules", "Auto recharge", "Pet hair brush"],
    specs: { Runtime: "120 minutes", Bin: "500 ml", Mapping: "LiDAR", Warranty: "90 days" },
    included: ["Vacuum", "Dock", "Filter", "Brush tool"],
    description: "A refurbished smart vacuum tested for daily cleaning and room-by-room scheduling.",
  },
  {
    id: "p7",
    slug: "brewline-espresso-station",
    sku: "BRW-ESP-01",
    name: "Brewline Compact Espresso Station",
    brand: "Brewline",
    category: "Appliances",
    image: img("photo-1495474472287-4d71bcdd2085"),
    images: [img("photo-1495474472287-4d71bcdd2085"), img("photo-1514432324607-a09d9b4aefdd")],
    price: 399.99,
    oldPrice: 499.99,
    rating: 4.4,
    reviews: 186,
    condition: "New",
    color: "Steel",
    stock: 14,
    seller: "HomeGrid",
    sellerRating: 4.5,
    online: true,
    pickup: true,
    freeShipping: false,
    badge: "Sale",
    features: ["15-bar pump", "Milk frother", "Compact footprint", "Dual shot basket"],
    specs: { Pressure: "15 bar", Tank: "1.4 L", Material: "Stainless steel", Width: "19 cm" },
    included: ["Machine", "Portafilter", "Tamper", "Milk pitcher"],
    description: "A compact espresso setup for rich shots and silky milk drinks at home.",
  },
  {
    id: "p8",
    slug: "focuscam-mirrorless-kit",
    sku: "FCM-M50-KIT",
    name: "FocusCam M50 Mirrorless Creator Kit",
    brand: "FocusCam",
    category: "Cameras",
    image: img("photo-1516035069371-29a1b244cc32"),
    images: [img("photo-1516035069371-29a1b244cc32"), img("photo-1502920917128-1aa500764cbd")],
    price: 699.99,
    rating: 4.6,
    reviews: 274,
    condition: "Open Box Good",
    color: "Black",
    stock: 9,
    seller: "Lens Lane",
    sellerRating: 4.8,
    online: true,
    pickup: true,
    freeShipping: true,
    badge: "Open Box",
    features: ["24MP sensor", "4K video", "Flip screen", "18-55mm lens"],
    specs: { Sensor: "24MP APS-C", Video: "4K 30fps", Lens: "18-55mm", Screen: "Vari-angle" },
    included: ["Camera body", "Lens", "Battery", "Charger", "Strap"],
    description: "An open-box creator kit for sharp photography, video, and travel content.",
  },
];

export const banners = [
  { title: "Fresh tech, sharper prices", copy: "Save on laptops, audio, gaming, and smart home essentials.", cta: "Shop deals" },
  { title: "Pickup ready today", copy: "Reserve eligible items online and collect them fast at your local store.", cta: "Find stores" },
];

export const orders = [
  {
    id: "ORD-10482",
    date: "2026-05-02",
    status: "Out for delivery",
    total: 1349.98,
    items: [products[0], products[2]],
    steps: ["Placed", "Paid", "Packed", "Shipped", "Delivered"],
    currentStep: 3,
  },
  {
    id: "ORD-10351",
    date: "2026-04-19",
    status: "Ready for pickup",
    total: 499.99,
    items: [products[4]],
    steps: ["Placed", "Paid", "Reserved", "Ready", "Picked up"],
    currentStep: 3,
  },
];

export const protectionPlans = [
  { id: "plan-1", name: "Protection 1 year", multiplier: 0.08 },
  { id: "plan-2", name: "Protection 2 years", multiplier: 0.13 },
  { id: "plan-3", name: "Protection 3 years", multiplier: 0.18 },
];

export const sellers = [
  { name: "Central Market", rating: 4.9, orders: 18420, returns: "30 days", commission: "12%" },
  { name: "Vision Depot", rating: 4.6, orders: 8930, returns: "21 days", commission: "10%" },
  { name: "RenewTech", rating: 4.4, orders: 5230, returns: "14 days", commission: "9%" },
  { name: "Lens Lane", rating: 4.8, orders: 3780, returns: "30 days", commission: "11%" },
];

export function money(value: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(slug: string) {
  const name = categories.find((category) => slugify(category) === slug);
  if (!name) return products;
  if (name === "Deals") return products.filter((product) => product.oldPrice);
  if (name === "Open Box") return products.filter((product) => product.condition !== "New");
  return products.filter((product) => product.category === name);
}
