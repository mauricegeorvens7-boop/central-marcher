export const databaseSchema = [
  "users",
  "products",
  "categories",
  "product_images",
  "product_variants",
  "inventory",
  "stores",
  "carts",
  "cart_items",
  "orders",
  "order_items",
  "payments",
  "sellers",
  "reviews",
  "favorites",
  "protection_plans",
  "returns",
  "coupons",
  "banners",
  "support_tickets",
];

export const implementationNotes = [
  "Next.js API routes expose mock catalog, search, checkout, and support endpoints.",
  "Stripe, Supabase Auth, storage, and PostgreSQL are represented as integration-ready placeholders.",
  "Roles are modeled as customer, admin, and seller in the UI and API notes.",
];
