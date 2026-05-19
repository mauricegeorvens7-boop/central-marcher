import "server-only";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Pool, type QueryResultRow } from "pg";
import { slugify } from "@/lib/data";

export type UserRole = "admin" | "customer" | "seller";

export type DbProductImage = {
  id: string;
  productId: string;
  url: string;
  publicId: string | null;
  mediaType: "image" | "video";
  alt: string | null;
  sortOrder: number;
};

export type DbProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  promoPrice: number | null;
  shortDescription: string;
  description: string;
  benefitsAndUsage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  keywords: string | null;
  variantsJson: string | null;
  shippingJson: string | null;
  protectionJson: string | null;
  marketplaceJson: string | null;
  specsJson: string | null;
  discountJson: string | null;
  categoryId: string;
  categoryName: string;
  stock: number;
  status: "active" | "draft" | "hidden";
  brand: string;
  condition: string;
  color: string | null;
  size: string | null;
  model: string | null;
  sellerId: string | null;
  createdAt: string;
  images: DbProductImage[];
};

export type DbCategory = { id: string; name: string; slug: string };

export type DbBanner = {
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
  position: "homepage_hero" | "category_banner" | "promo_banner";
  backgroundColor: string;
  gradient: string | null;
  imagePosition: "left" | "right" | "center" | "top" | "bottom";
  textPosition: "left" | "right" | "center";
  size: "large" | "medium" | "small";
  active: number;
  createdAt: string;
};

export type DbAnnouncement = {
  id: string;
  text: string;
  link: string | null;
  imageUrl: string | null;
  publicId: string | null;
  type: "top_bar" | "popup" | "product_promo" | "homepage_section";
  startDate: string;
  endDate: string;
  active: number;
  createdAt: string;
};

export type DbUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  profilePhoto: string | null;
  gender: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  coverPhoto: string | null;
  accountStatus: string;
  notifications: string;
  settings: string;
  balance: number;
};

export type DbSeller = {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  contactName: string;
  email: string;
  phone: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  returnPolicy: string | null;
  shippingDelay: string | null;
  commissionRate: number;
  rating: number;
  status: "pending" | "active" | "suspended" | "rejected";
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  ticketNo: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export type AdminOrderItem = {
  id?: string;
  productId?: string;
  slug?: string;
  name: string;
  brand?: string;
  image?: string;
  price: number;
  quantity: number;
  sku?: string;
  variantLabel?: string;
  seller?: string;
};

export type AdminOrder = {
  id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentMethod: string | null;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    profilePhoto: string | null;
    gender: string | null;
  };
  items: AdminOrderItem[];
  paymentProof: {
    transactionNo: string | null;
    proofUrl: string | null;
    payerPhone: string | null;
    adminNote: string | null;
    status: string | null;
  };
  history: { id: string; status: string; note: string | null; createdAt: string }[];
};

export type PaymentSettings = {
  moncashEnabled: number;
  moncashNumber: string;
  natcashEnabled: number;
  natcashNumber: string;
  cashOnDeliveryEnabled: number;
};

export type PaymentTransaction = {
  id: string;
  transactionNo: string;
  userId: string | null;
  orderId: string | null;
  type: "order" | "recharge";
  method: "moncash" | "natcash" | "balance" | "cash_on_delivery" | "stripe";
  status: "pending" | "paid" | "rejected";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  payerPhone: string | null;
  proofUrl: string | null;
  proofPublicId: string | null;
  adminNote: string | null;
  createdAt: string;
};

export type DbDiscount = {
  id: string;
  name: string;
  type: string;
  enabled: number;
  percent: number | null;
  badge: string | null;
  code: string | null;
  startDate: string | null;
  endDate: string | null;
  newCustomerDays: number | null;
  minAmount: number | null;
  categoriesJson: string | null;
  excludedProductsJson: string | null;
  usageCount: number;
  revenueGenerated: number;
  createdAt: string;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString || !/^postgres(ql)?:\/\//.test(connectionString)) {
  throw new Error("DATABASE_URL must be a Supabase/Postgres connection string.");
}

const globalForPg = globalThis as unknown as { centralMarcherPool?: Pool };
const db =
  globalForPg.centralMarcherPool ??
  new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForPg.centralMarcherPool = db;

const now = () => new Date().toISOString();
const id = () => randomUUID();

async function q<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  const result = await db.query<T>(text, values);
  return result.rows;
}

async function one<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  const rows = await q<T>(text, values);
  return rows[0];
}

export async function initDb() {
  await ensureDefaultAdmin();
}

export async function seedDb() {
  await ensureDefaultAdmin();
}

async function ensureDefaultAdmin() {
  const existing = await one("SELECT id FROM users WHERE email=$1 LIMIT 1", ["admin@store.com"]);
  if (existing) return;
  await q(
    `INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id(),
      "admin@store.com",
      await bcrypt.hash("Admin123456!", 12),
      "Store Admin",
      "admin",
      "+1 555 0100",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      now(),
      now(),
    ],
  );
}

function userRow(row?: Record<string, unknown>) {
  if (!row) return undefined;
  return {
    id: String(row.id),
    email: String(row.email),
    password_hash: String(row.password_hash),
    name: String(row.name),
    role: String(row.role) as UserRole,
    account_status: String(row.account_status || "active"),
  };
}

function mapUser(row?: Record<string, unknown>): DbUser | undefined {
  if (!row) return undefined;
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role) as UserRole,
    phone: row.phone == null ? null : String(row.phone),
    profilePhoto: row.profile_photo == null ? null : String(row.profile_photo),
    gender: row.gender == null ? null : String(row.gender),
    firstName: row.first_name == null ? null : String(row.first_name),
    lastName: row.last_name == null ? null : String(row.last_name),
    birthDate: row.birth_date == null ? null : String(row.birth_date),
    coverPhoto: row.cover_photo == null ? null : String(row.cover_photo),
    accountStatus: String(row.account_status || "active"),
    notifications: String(row.notifications || "{}"),
    settings: String(row.settings || "{}"),
    balance: Number(row.balance || 0),
  };
}

export async function getAdminByEmail(email: string) {
  return userRow(await one("SELECT * FROM users WHERE email=$1 AND role='admin'", [email])) as
    | { id: string; email: string; password_hash: string; name: string; role: "admin"; account_status?: string }
    | undefined;
}

export async function getUserByEmail(email: string) {
  return userRow(await one("SELECT * FROM users WHERE email=$1", [email]));
}

export async function getUserById(userId: string) {
  return mapUser(await one("SELECT * FROM users WHERE id=$1", [userId]));
}

export async function updateUserProfile(userId: string, input: {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  language?: string;
  profilePhoto?: string;
  coverPhoto?: string;
}) {
  const user = await getUserById(userId);
  if (!user) return null;
  const firstName = input.firstName?.trim() || user.firstName || user.name.split(" ")[0] || user.name;
  const lastName = input.lastName?.trim() || user.lastName || user.name.split(" ").slice(1).join(" ");
  const settings = JSON.parse(user.settings || "{}") as Record<string, unknown>;
  if (input.language) settings.language = input.language;
  await q(
    `UPDATE users SET first_name=$1,last_name=$2,name=$3,gender=$4,birth_date=$5,phone=$6,email=$7,
     profile_photo=$8,cover_photo=$9,settings=$10,updated_at=$11 WHERE id=$12`,
    [
      firstName,
      lastName,
      `${firstName} ${lastName}`.trim(),
      input.gender || null,
      input.birthDate || null,
      input.phone || null,
      input.email || user.email,
      input.profilePhoto || user.profilePhoto,
      input.coverPhoto || user.coverPhoto,
      JSON.stringify(settings),
      now(),
      userId,
    ],
  );
  return getUserById(userId);
}

export async function changeUserPassword(userId: string, currentPassword: string, nextPassword: string) {
  const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=$1", [userId]);
  if (!row) return { ok: false, error: "Utilisateur introuvable." };
  const valid = await bcrypt.compare(currentPassword, row.password_hash);
  if (!valid) return { ok: false, error: "Mot de passe actuel incorrect." };
  await q("UPDATE users SET password_hash=$1,updated_at=$2 WHERE id=$3", [await bcrypt.hash(nextPassword, 12), now(), userId]);
  return { ok: true };
}

export async function saveUserAddress(userId: string, input: {
  id?: string;
  label: string;
  name: string;
  line1: string;
  city: string;
  province: string;
  postalCode: string;
  phone?: string;
  isDefault?: boolean;
}) {
  if (input.isDefault) await q("UPDATE user_addresses SET is_default=0 WHERE user_id=$1", [userId]);
  if (input.id) {
    await q(
      "UPDATE user_addresses SET label=$1,name=$2,line1=$3,city=$4,province=$5,postal_code=$6,phone=$7,is_default=$8 WHERE id=$9 AND user_id=$10",
      [input.label, input.name, input.line1, input.city, input.province, input.postalCode, input.phone || null, input.isDefault ? 1 : 0, input.id, userId],
    );
    return input.id;
  }
  const addressId = id();
  await q(
    "INSERT INTO user_addresses (id,user_id,label,name,line1,city,province,postal_code,phone,is_default,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    [addressId, userId, input.label, input.name, input.line1, input.city, input.province, input.postalCode, input.phone || null, input.isDefault ? 1 : 0, now()],
  );
  return addressId;
}

export async function deleteUserAddress(userId: string, addressId: string) {
  await q("DELETE FROM user_addresses WHERE id=$1 AND user_id=$2", [addressId, userId]);
}

export async function createCustomer(input: { name: string; email: string; password: string; phone?: string }) {
  const userId = id();
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  await q(
    `INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,first_name,last_name,created_at,updated_at)
     VALUES ($1,$2,$3,$4,'customer',$5,$6,$7,$8,$9,$10)`,
    [
      userId,
      input.email,
      await bcrypt.hash(input.password, 12),
      input.name,
      input.phone || null,
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      firstName || input.name,
      rest.join(" "),
      now(),
      now(),
    ],
  );
  return getUserById(userId);
}

export async function getCategories() {
  return (await q<DbCategory>("SELECT id,name,slug FROM categories ORDER BY name")).map((category) => ({ ...category }));
}

export async function getCategoryBySlug(slug: string) {
  return one<DbCategory>("SELECT id,name,slug FROM categories WHERE slug=$1", [slug]);
}

async function rowToProduct(row: Record<string, unknown>): Promise<DbProduct> {
  const product: DbProduct = {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    sku: String(row.sku),
    price: Number(row.price),
    promoPrice: row.promo_price == null ? null : Number(row.promo_price),
    shortDescription: String(row.short_description),
    description: String(row.description),
    benefitsAndUsage: row.benefits_and_usage == null ? null : String(row.benefits_and_usage),
    seoTitle: row.seo_title == null ? null : String(row.seo_title),
    seoDescription: row.seo_description == null ? null : String(row.seo_description),
    keywords: row.keywords == null ? null : String(row.keywords),
    variantsJson: row.variants_json == null ? null : String(row.variants_json),
    shippingJson: row.shipping_json == null ? null : String(row.shipping_json),
    protectionJson: row.protection_json == null ? null : String(row.protection_json),
    marketplaceJson: row.marketplace_json == null ? null : String(row.marketplace_json),
    specsJson: row.specs_json == null ? null : String(row.specs_json),
    discountJson: row.discount_json == null ? null : String(row.discount_json),
    categoryId: String(row.category_id),
    categoryName: String(row.category_name),
    stock: Number(row.stock),
    status: String(row.status) as DbProduct["status"],
    brand: String(row.brand),
    condition: String(row.condition),
    color: row.color == null ? null : String(row.color),
    size: row.size == null ? null : String(row.size),
    model: row.model == null ? null : String(row.model),
    sellerId: row.seller_id == null ? null : String(row.seller_id),
    createdAt: String(row.created_at),
    images: [],
  };
  product.images = await getProductImages(product.id);
  return product;
}

async function rowsToProducts(rows: Record<string, unknown>[]) {
  return Promise.all(rows.map(rowToProduct));
}

export async function getProducts(options: { includeHidden?: boolean; categorySlug?: string; sellerId?: string } = {}) {
  const where: string[] = [];
  const values: unknown[] = [];
  if (!options.includeHidden) where.push("p.status = 'active'");
  if (options.sellerId) {
    values.push(options.sellerId);
    where.push(`p.seller_id = $${values.length}`);
  }
  if (options.categorySlug) {
    values.push(options.categorySlug);
    where.push(`c.slug = $${values.length}`);
  }
  const rows = await q(`
    SELECT p.*, c.name AS category_name
    FROM products p JOIN categories c ON c.id = p.category_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY p.created_at DESC
  `, values);
  return rowsToProducts(rows);
}

export async function getProductBySlug(slug: string) {
  const row = await one("SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.slug=$1", [slug]);
  return row ? rowToProduct(row) : undefined;
}

export async function getProductById(productId: string) {
  const row = await one("SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=$1", [productId]);
  return row ? rowToProduct(row) : undefined;
}

export async function getProductImages(productId: string) {
  const rows = await q("SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order", [productId]);
  return rows.map((image) => ({
    id: String(image.id),
    productId: String(image.product_id),
    url: String(image.url),
    publicId: image.public_id == null ? null : String(image.public_id),
    mediaType: (image.media_type || "image") as "image" | "video",
    alt: image.alt == null ? null : String(image.alt),
    sortOrder: Number(image.sort_order || 0),
  }));
}

export async function saveProduct(input: {
  id?: string;
  name: string;
  sku: string;
  price: number;
  promoPrice?: number | null;
  shortDescription: string;
  description: string;
  benefitsAndUsage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  keywords?: string | null;
  variantsJson?: string | null;
  shippingJson?: string | null;
  protectionJson?: string | null;
  marketplaceJson?: string | null;
  specsJson?: string | null;
  discountJson?: string | null;
  categoryId: string;
  stock: number;
  status: DbProduct["status"];
  brand: string;
  condition: string;
  color?: string | null;
  size?: string | null;
  model?: string | null;
  sellerId?: string | null;
  images: { url: string; publicId?: string | null; mediaType?: "image" | "video" }[];
}) {
  const productId = input.id || id();
  const slug = input.id ? slugify(input.name) : `${slugify(input.name)}-${productId.slice(0, 6)}`;
  const values = [
    productId, input.name, slug, input.sku, input.price, input.promoPrice ?? null, input.shortDescription,
    input.description, input.categoryId, input.stock, input.status, input.brand, input.condition, input.color ?? null,
    input.size ?? null, input.model ?? null, input.benefitsAndUsage ?? null, input.seoTitle ?? null,
    input.seoDescription ?? null, input.keywords ?? null, input.variantsJson ?? null, input.shippingJson ?? null,
    input.protectionJson ?? null, input.marketplaceJson ?? null, input.specsJson ?? null, input.discountJson ?? null,
    input.sellerId ?? null, now(), now(),
  ];
  await q(
    `INSERT INTO products (id,name,slug,sku,price,promo_price,short_description,description,category_id,stock,status,brand,condition,color,size,model,benefits_and_usage,seo_title,seo_description,keywords,variants_json,shipping_json,protection_json,marketplace_json,specs_json,discount_json,seller_id,created_at,updated_at)
     VALUES (${values.map((_, i) => `$${i + 1}`).join(",")})
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,slug=EXCLUDED.slug,sku=EXCLUDED.sku,price=EXCLUDED.price,promo_price=EXCLUDED.promo_price,
     short_description=EXCLUDED.short_description,description=EXCLUDED.description,category_id=EXCLUDED.category_id,stock=EXCLUDED.stock,status=EXCLUDED.status,
     brand=EXCLUDED.brand,condition=EXCLUDED.condition,color=EXCLUDED.color,size=EXCLUDED.size,model=EXCLUDED.model,benefits_and_usage=EXCLUDED.benefits_and_usage,
     seo_title=EXCLUDED.seo_title,seo_description=EXCLUDED.seo_description,keywords=EXCLUDED.keywords,variants_json=EXCLUDED.variants_json,
     shipping_json=EXCLUDED.shipping_json,protection_json=EXCLUDED.protection_json,marketplace_json=EXCLUDED.marketplace_json,specs_json=EXCLUDED.specs_json,
     discount_json=EXCLUDED.discount_json,seller_id=EXCLUDED.seller_id,updated_at=EXCLUDED.updated_at`,
    values,
  );
  await q("DELETE FROM product_images WHERE product_id=$1", [productId]);
  for (const [index, image] of input.images.entries()) {
    if (!image.url) continue;
    await q("INSERT INTO product_images (id,product_id,url,public_id,media_type,alt,sort_order,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [
      id(), productId, image.url, image.publicId ?? null, image.mediaType || "image", input.name, index, now(),
    ]);
  }
  return getProductById(productId);
}

export async function deleteProduct(productId: string) {
  await q("DELETE FROM products WHERE id=$1", [productId]);
}

export async function getBanners(includeInactive = false) {
  const rows = await q(`
    SELECT * FROM banners ${includeInactive ? "" : "WHERE active=1"} ORDER BY created_at DESC
  `);
  return rows.map((banner) => {
    let productImages: { url: string; publicId?: string | null }[] = [];
    try { productImages = JSON.parse(String(banner.product_images_json || "[]")); } catch { productImages = []; }
    if (!productImages.length && banner.product_image_url) productImages = [{ url: String(banner.product_image_url), publicId: banner.product_public_id == null ? null : String(banner.product_public_id) }];
    return {
      id: String(banner.id), title: String(banner.title), subtitle: String(banner.subtitle), imageUrl: String(banner.image_url),
      publicId: banner.public_id == null ? null : String(banner.public_id), productImageUrl: banner.product_image_url == null ? null : String(banner.product_image_url),
      productPublicId: banner.product_public_id == null ? null : String(banner.product_public_id), productImages,
      ctaText: String(banner.cta_text), ctaLink: String(banner.cta_link), position: String(banner.position) as DbBanner["position"],
      backgroundColor: String(banner.background_color || "#0f5132"), gradient: banner.gradient == null ? null : String(banner.gradient),
      imagePosition: String(banner.image_position || "right") as DbBanner["imagePosition"], textPosition: String(banner.text_position || "left") as DbBanner["textPosition"],
      size: String(banner.size || "large") as DbBanner["size"], active: Number(banner.active), createdAt: String(banner.created_at),
    };
  });
}

export async function saveBanner(input: {
  id?: string; title: string; subtitle: string; imageUrl: string; publicId?: string | null; productImageUrl?: string | null;
  productPublicId?: string | null; productImages?: { url: string; publicId?: string | null }[]; ctaText: string; ctaLink: string;
  position: DbBanner["position"]; backgroundColor?: string; gradient?: string | null; imagePosition?: DbBanner["imagePosition"];
  textPosition?: DbBanner["textPosition"]; size?: DbBanner["size"]; active: boolean | number;
}) {
  const bannerId = input.id || id();
  const productImages = input.productImages?.length ? input.productImages.filter((image) => image.url) : input.productImageUrl ? [{ url: input.productImageUrl, publicId: input.productPublicId }] : [];
  const primary = productImages[0];
  const values = [
    bannerId, input.title, input.subtitle, input.imageUrl, input.publicId ?? null, primary?.url ?? null, primary?.publicId ?? null,
    JSON.stringify(productImages), input.ctaText, input.ctaLink, input.position, input.backgroundColor || "#0f5132", input.gradient || null,
    input.imagePosition || "right", input.textPosition || "left", input.size || "large", input.active ? 1 : 0, now(), now(),
  ];
  await q(
    `INSERT INTO banners (id,title,subtitle,image_url,public_id,product_image_url,product_public_id,product_images_json,cta_text,cta_link,position,background_color,gradient,image_position,text_position,size,active,created_at,updated_at)
     VALUES (${values.map((_, i) => `$${i + 1}`).join(",")})
     ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,image_url=EXCLUDED.image_url,public_id=EXCLUDED.public_id,
     product_image_url=EXCLUDED.product_image_url,product_public_id=EXCLUDED.product_public_id,product_images_json=EXCLUDED.product_images_json,
     cta_text=EXCLUDED.cta_text,cta_link=EXCLUDED.cta_link,position=EXCLUDED.position,background_color=EXCLUDED.background_color,gradient=EXCLUDED.gradient,
     image_position=EXCLUDED.image_position,text_position=EXCLUDED.text_position,size=EXCLUDED.size,active=EXCLUDED.active,updated_at=EXCLUDED.updated_at`,
    values,
  );
}

export async function deleteBanner(bannerId: string) {
  await q("DELETE FROM banners WHERE id=$1", [bannerId]);
}

export async function getAnnouncements(includeInactive = false) {
  const rows = await q(`SELECT * FROM announcements ${includeInactive ? "" : "WHERE active=1 AND CURRENT_DATE BETWEEN start_date::date AND end_date::date"} ORDER BY created_at DESC`);
  return rows.map((row) => ({
    id: String(row.id), text: String(row.text), link: row.link == null ? null : String(row.link),
    imageUrl: row.image_url == null ? null : String(row.image_url), publicId: row.public_id == null ? null : String(row.public_id),
    type: String(row.type) as DbAnnouncement["type"], startDate: String(row.start_date), endDate: String(row.end_date),
    active: Number(row.active), createdAt: String(row.created_at),
  }));
}

export async function saveAnnouncement(input: { id?: string; text: string; link?: string | null; imageUrl?: string | null; publicId?: string | null; type: DbAnnouncement["type"]; startDate: string; endDate: string; active: boolean | number }) {
  const announcementId = input.id || id();
  const values = [announcementId, input.text, input.link ?? null, input.imageUrl ?? null, input.publicId ?? null, input.type, input.startDate, input.endDate, input.active ? 1 : 0, now(), now()];
  await q(
    `INSERT INTO announcements (id,text,link,image_url,public_id,type,start_date,end_date,active,created_at,updated_at)
     VALUES (${values.map((_, i) => `$${i + 1}`).join(",")})
     ON CONFLICT (id) DO UPDATE SET text=EXCLUDED.text,link=EXCLUDED.link,image_url=EXCLUDED.image_url,public_id=EXCLUDED.public_id,type=EXCLUDED.type,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,active=EXCLUDED.active,updated_at=EXCLUDED.updated_at`,
    values,
  );
}

export async function deleteAnnouncement(announcementId: string) {
  await q("DELETE FROM announcements WHERE id=$1", [announcementId]);
}

export async function getOrders() {
  const rows = await q("SELECT id,order_no,status,payment_status,fulfillment_status,total,created_at FROM orders ORDER BY created_at DESC");
  return rows.map((order) => ({
    id: String(order.id), orderNo: String(order.order_no), status: String(order.status), paymentStatus: String(order.payment_status),
    fulfillmentStatus: String(order.fulfillment_status), total: Number(order.total), createdAt: String(order.created_at),
  }));
}

function parseOrderItems(itemsJson: string | null): AdminOrderItem[] {
  try {
    const parsed = JSON.parse(itemsJson || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: item.id ? String(item.id) : undefined, productId: item.productId ? String(item.productId) : undefined,
      slug: item.slug ? String(item.slug) : undefined, name: item.name ? String(item.name) : "Produit",
      brand: item.brand ? String(item.brand) : undefined, image: item.image ? String(item.image) : undefined,
      price: Number(item.price || 0), quantity: Number(item.quantity || 1), sku: item.sku ? String(item.sku) : undefined,
      variantLabel: item.variantLabel ? String(item.variantLabel) : undefined, seller: item.seller ? String(item.seller) : undefined,
    }));
  } catch { return []; }
}

function rowToAdminOrder(row: Record<string, unknown>): AdminOrder {
  return {
    id: String(row.id), orderNo: String(row.order_no), status: String(row.status || ""), paymentStatus: String(row.payment_status || ""),
    fulfillmentStatus: String(row.fulfillment_status || ""), paymentMethod: row.payment_method == null ? null : String(row.payment_method),
    total: Number(row.total || 0), customerName: String(row.contact_name || row.user_name || "Client"),
    customerEmail: String(row.contact_email || row.user_email || ""), customerPhone: String(row.contact_phone || row.user_phone || ""),
    shippingAddress: String(row.shipping_address || ""), createdAt: String(row.created_at), updatedAt: String(row.updated_at || row.created_at),
    user: { id: row.user_id == null ? null : String(row.user_id), name: row.user_name == null ? null : String(row.user_name), email: row.user_email == null ? null : String(row.user_email), phone: row.user_phone == null ? null : String(row.user_phone), profilePhoto: row.profile_photo == null ? null : String(row.profile_photo), gender: row.gender == null ? null : String(row.gender) },
    items: parseOrderItems(row.items_json == null ? null : String(row.items_json)),
    paymentProof: { transactionNo: row.transaction_no == null ? null : String(row.transaction_no), proofUrl: row.proof_url == null ? null : String(row.proof_url), payerPhone: row.payer_phone == null ? null : String(row.payer_phone), adminNote: row.admin_note == null ? null : String(row.admin_note), status: row.transaction_status == null ? null : String(row.transaction_status) },
    history: [],
  };
}

async function orderRows(where = "", values: unknown[] = []) {
  return q(`
    SELECT o.*, u.id AS user_id, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.profile_photo, u.gender,
      pt.transaction_no, pt.proof_url, pt.payer_phone, pt.admin_note, pt.status AS transaction_status
    FROM orders o
    LEFT JOIN users u ON u.id=o.user_id
    LEFT JOIN payment_transactions pt ON pt.order_id=o.id
    ${where}
    ORDER BY o.created_at DESC
  `, values);
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  return (await orderRows()).map(rowToAdminOrder);
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrder | null> {
  const row = (await orderRows("WHERE o.id=$1", [orderId]))[0];
  if (!row) return null;
  const order = rowToAdminOrder(row);
  order.history = (await q("SELECT id,status,note,created_at FROM order_status_history WHERE order_id=$1 ORDER BY created_at DESC", [orderId])).map((item) => ({
    id: String(item.id), status: String(item.status), note: item.note == null ? null : String(item.note), createdAt: String(item.created_at),
  }));
  return order;
}

export async function updateOrderStatus(input: { id: string; status: string; note?: string | null }) {
  const allowed = ["Nouvelle commande", "En cours", "En livraison", "Livrée", "Annulée"];
  if (!allowed.includes(input.status)) return null;
  const order = await getAdminOrderById(input.id);
  if (!order) return null;
  const paymentStatus = input.status === "Annulée" && order.paymentStatus !== "Paid" ? "Rejected" : order.paymentStatus;
  await q("UPDATE orders SET status=$1,fulfillment_status=$2,payment_status=$3,tracking_note=$4,updated_at=$5 WHERE id=$6", [input.status, input.status, paymentStatus, input.note ?? null, now(), input.id]);
  await q("INSERT INTO order_status_history (id,order_id,status,note,created_at) VALUES ($1,$2,$3,$4,$5)", [id(), input.id, input.status, input.note ?? null, now()]);
  return getAdminOrderById(input.id);
}

export async function getOrdersForUser(userId: string, limit = 5) {
  const user = await getUserById(userId);
  const rows = await q("SELECT id,order_no,status,payment_status,fulfillment_status,total,created_at FROM orders WHERE user_id=$1 OR contact_email=$2 ORDER BY created_at DESC LIMIT $3", [userId, user?.email || "", limit]);
  return rows.map((order) => ({
    id: String(order.id), orderNo: String(order.order_no), status: String(order.status), paymentStatus: String(order.payment_status),
    fulfillmentStatus: String(order.fulfillment_status), total: Number(order.total), createdAt: String(order.created_at),
  }));
}

export async function getAllOrdersForUser(userId: string) {
  return getOrdersForUser(userId, 100);
}

export async function getAccountAlertSnapshot(userId: string) {
  const user = await getUserById(userId);
  const orders = await q(`
    SELECT o.id,o.payment_status,o.fulfillment_status,o.updated_at,
      (SELECT h.status FROM order_status_history h WHERE h.order_id=o.id ORDER BY h.created_at DESC LIMIT 1) AS latest_history_status,
      (SELECT h.created_at FROM order_status_history h WHERE h.order_id=o.id ORDER BY h.created_at DESC LIMIT 1) AS latest_history_at
    FROM orders o WHERE o.user_id=$1 OR o.contact_email=$2 ORDER BY o.updated_at DESC LIMIT 100
  `, [userId, user?.email || ""]);
  const transactions = await q("SELECT id,type,method,status,updated_at FROM payment_transactions WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100", [userId]);
  return {
    signature: `${orders.map((order) => `${order.id}:${order.payment_status}:${order.fulfillment_status}:${order.updated_at}:${order.latest_history_status || ""}:${order.latest_history_at || ""}`).sort().join("|")}::${transactions.map((tx) => `${tx.id}:${tx.type}:${tx.method}:${tx.status}:${tx.updated_at}`).sort().join("|")}`,
    latestOrderStatus: String(orders[0]?.latest_history_status || orders[0]?.fulfillment_status || ""),
    latestTransactionStatus: String(transactions[0]?.status || ""),
  };
}

export async function getOrderForUserById(userId: string, orderId: string) {
  const user = await getUserById(userId);
  const order = await getAdminOrderById(orderId);
  if (!order) return null;
  if (order.user.id === userId || (user?.email && order.customerEmail === user.email)) return order;
  return null;
}

export async function getAddressesForUser(userId: string) {
  const rows = await q("SELECT * FROM user_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC", [userId]);
  return rows.map((address) => ({
    id: String(address.id), label: String(address.label), name: String(address.name), line1: String(address.line1),
    city: String(address.city), province: String(address.province), postalCode: String(address.postal_code),
    phone: address.phone == null ? null : String(address.phone), isDefault: Number(address.is_default),
  }));
}

export async function getFavoritesForUser(userId: string) {
  const favorites = await q("SELECT p.*,c.name AS category_name FROM favorites f JOIN products p ON p.id=f.product_id JOIN categories c ON c.id=p.category_id WHERE f.user_id=$1 ORDER BY f.created_at DESC", [userId]);
  const rows = favorites.length ? favorites : await q("SELECT p.*,c.name AS category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.status='active' ORDER BY p.created_at DESC LIMIT 3");
  return rowsToProducts(rows);
}

export async function getRecentlyViewedForUser(userId: string) {
  const viewed = await q("SELECT p.*,c.name AS category_name FROM recently_viewed r JOIN products p ON p.id=r.product_id JOIN categories c ON c.id=p.category_id WHERE r.user_id=$1 ORDER BY r.viewed_at DESC LIMIT 3", [userId]);
  const rows = viewed.length ? viewed : await q("SELECT p.*,c.name AS category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.status='active' ORDER BY p.created_at ASC LIMIT 3");
  return rowsToProducts(rows);
}

export async function getAdminStats() {
  const [products, orders, sales] = await Promise.all([
    one<{ count: string }>("SELECT COUNT(*) AS count FROM products"),
    one<{ count: string }>("SELECT COUNT(*) AS count FROM orders"),
    one<{ total: number | null }>("SELECT COALESCE(SUM(total),0) AS total FROM orders"),
  ]);
  return { totalProducts: Number(products?.count || 0), totalOrders: Number(orders?.count || 0), totalSales: Number(sales?.total || 0) };
}

export async function getDiscounts(includeDisabled = true) {
  const rows = await q(`SELECT * FROM discounts ${includeDisabled ? "" : "WHERE enabled=1"} ORDER BY created_at DESC`);
  return rows.map((row) => ({
    id: String(row.id), name: String(row.name), type: String(row.type), enabled: Number(row.enabled),
    percent: row.percent == null ? null : Number(row.percent), badge: row.badge == null ? null : String(row.badge), code: row.code == null ? null : String(row.code),
    startDate: row.start_date == null ? null : String(row.start_date), endDate: row.end_date == null ? null : String(row.end_date),
    newCustomerDays: row.new_customer_days == null ? null : Number(row.new_customer_days), minAmount: row.min_amount == null ? null : Number(row.min_amount),
    categoriesJson: row.categories_json == null ? null : String(row.categories_json), excludedProductsJson: row.excluded_products_json == null ? null : String(row.excluded_products_json),
    usageCount: Number(row.usage_count || 0), revenueGenerated: Number(row.revenue_generated || 0), createdAt: String(row.created_at),
  }));
}

export async function saveDiscount(input: Partial<DbDiscount> & { name: string; type: string }) {
  const discountId = input.id || id();
  const values = [discountId, input.name, input.type, input.enabled ? 1 : 0, input.percent ?? null, input.badge ?? null, input.code ?? null, input.startDate ?? null, input.endDate ?? null, input.newCustomerDays ?? null, input.minAmount ?? null, input.categoriesJson ?? null, input.excludedProductsJson ?? null, now(), now()];
  await q(
    `INSERT INTO discounts (id,name,type,enabled,percent,badge,code,start_date,end_date,new_customer_days,min_amount,categories_json,excluded_products_json,created_at,updated_at)
     VALUES (${values.map((_, i) => `$${i + 1}`).join(",")})
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,type=EXCLUDED.type,enabled=EXCLUDED.enabled,percent=EXCLUDED.percent,badge=EXCLUDED.badge,code=EXCLUDED.code,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,new_customer_days=EXCLUDED.new_customer_days,min_amount=EXCLUDED.min_amount,categories_json=EXCLUDED.categories_json,excluded_products_json=EXCLUDED.excluded_products_json,updated_at=EXCLUDED.updated_at`,
    values,
  );
}

export async function deleteDiscount(discountId: string) {
  await q("DELETE FROM discounts WHERE id=$1", [discountId]);
}

function orderNo() { return `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`; }
function transactionNo(prefix = "TXN") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }

export async function getPaymentSettings(): Promise<PaymentSettings> {
  await q("INSERT INTO payment_settings (id,updated_at) VALUES (1,$1) ON CONFLICT (id) DO NOTHING", [now()]);
  const row = await one("SELECT * FROM payment_settings WHERE id=1");
  return {
    moncashEnabled: Number(row?.moncash_enabled || 0), moncashNumber: String(row?.moncash_number || ""),
    natcashEnabled: Number(row?.natcash_enabled || 0), natcashNumber: String(row?.natcash_number || ""),
    cashOnDeliveryEnabled: Number(row?.cash_on_delivery_enabled || 0),
  };
}

export async function savePaymentSettings(input: Partial<PaymentSettings>) {
  await q("UPDATE payment_settings SET moncash_enabled=$1,moncash_number=$2,natcash_enabled=$3,natcash_number=$4,cash_on_delivery_enabled=$5,updated_at=$6 WHERE id=1", [input.moncashEnabled ? 1 : 0, input.moncashNumber ?? "", input.natcashEnabled ? 1 : 0, input.natcashNumber ?? "", input.cashOnDeliveryEnabled ? 1 : 0, now()]);
  return getPaymentSettings();
}

export async function createOrderWithTransaction(input: {
  userId?: string | null; type?: "order" | "recharge"; method: PaymentTransaction["method"]; status: PaymentTransaction["status"];
  paymentStatus: string; orderStatus?: string; customerName: string; customerEmail: string; customerPhone: string; amount: number;
  orderTotal?: number; payerPhone?: string | null; proofUrl?: string | null; proofPublicId?: string | null; items?: unknown[]; shippingAddress?: string;
}) {
  const txId = id();
  let orderId: string | null = null;
  const orderTotal = Number(input.orderTotal ?? input.amount);
  if ((input.type || "order") === "order") {
    orderId = id();
    await q(
      "INSERT INTO orders (id,order_no,user_id,status,payment_status,fulfillment_status,payment_method,total,contact_name,contact_email,contact_phone,shipping_address,items_json,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
      [orderId, orderNo(), input.userId ?? null, input.orderStatus || "Nouvelle commande", input.paymentStatus, input.paymentStatus === "Paid" ? "En cours" : "Nouvelle commande", input.method, orderTotal, input.customerName, input.customerEmail, input.customerPhone, input.shippingAddress || "", JSON.stringify(input.items || []), now(), now()],
    );
  }
  await q(
    "INSERT INTO payment_transactions (id,transaction_no,user_id,order_id,type,method,status,customer_name,customer_email,customer_phone,amount,payer_phone,proof_url,proof_public_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
    [txId, transactionNo(input.type === "recharge" ? "TOPUP" : "PAY"), input.userId ?? null, orderId, input.type || "order", input.method, input.status, input.customerName, input.customerEmail, input.customerPhone, input.amount, input.payerPhone ?? null, input.proofUrl ?? null, input.proofPublicId ?? null, now(), now()],
  );
  return { orderId, transactionId: txId };
}

function mapPayment(row: Record<string, unknown>): PaymentTransaction {
  return {
    id: String(row.id), transactionNo: String(row.transaction_no), userId: row.user_id == null ? null : String(row.user_id),
    orderId: row.order_id == null ? null : String(row.order_id), type: String(row.type) as PaymentTransaction["type"],
    method: String(row.method) as PaymentTransaction["method"], status: String(row.status) as PaymentTransaction["status"],
    customerName: String(row.customer_name), customerEmail: String(row.customer_email), customerPhone: String(row.customer_phone),
    amount: Number(row.amount), payerPhone: row.payer_phone == null ? null : String(row.payer_phone),
    proofUrl: row.proof_url == null ? null : String(row.proof_url), proofPublicId: row.proof_public_id == null ? null : String(row.proof_public_id),
    adminNote: row.admin_note == null ? null : String(row.admin_note), createdAt: String(row.created_at),
  };
}

export async function getPaymentTransactions() {
  return (await q("SELECT * FROM payment_transactions ORDER BY created_at DESC")).map(mapPayment);
}

export async function getPaymentTransactionsForUser(userId: string) {
  return (await q("SELECT * FROM payment_transactions WHERE user_id=$1 ORDER BY created_at DESC", [userId])).map(mapPayment);
}

function ticketNo() { return `TCK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`; }

export async function createSupportTicket(input: { userId?: string | null; name: string; email: string; subject: string; message: string }) {
  const ticketId = id();
  await q("INSERT INTO support_tickets (id,ticket_no,user_id,name,email,subject,message,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9)", [ticketId, ticketNo(), input.userId ?? null, input.name, input.email, input.subject, input.message, now(), now()]);
  return getSupportTicketById(ticketId);
}

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return { id: String(row.id), ticketNo: String(row.ticket_no), userId: row.user_id == null ? null : String(row.user_id), name: String(row.name), email: String(row.email), subject: String(row.subject), message: String(row.message), status: String(row.status), createdAt: String(row.created_at) };
}

export async function getSupportTicketById(ticketId: string) {
  const row = await one("SELECT * FROM support_tickets WHERE id=$1", [ticketId]);
  return row ? mapTicket(row) : undefined;
}

export async function getSupportTicketsForUser(userId: string) {
  return (await q("SELECT * FROM support_tickets WHERE user_id=$1 ORDER BY created_at DESC", [userId])).map(mapTicket);
}

export async function getSupportTickets() {
  return (await q("SELECT * FROM support_tickets ORDER BY created_at DESC")).map(mapTicket);
}

function rowToSeller(row: Record<string, unknown>): DbSeller {
  return {
    id: String(row.id), userId: String(row.user_id), storeName: String(row.store_name), slug: String(row.slug),
    contactName: String(row.contact_name), email: String(row.email), phone: row.phone == null ? null : String(row.phone),
    logoUrl: row.logo_url == null ? null : String(row.logo_url), coverUrl: row.cover_url == null ? null : String(row.cover_url),
    description: row.description == null ? null : String(row.description), returnPolicy: row.return_policy == null ? null : String(row.return_policy),
    shippingDelay: row.shipping_delay == null ? null : String(row.shipping_delay), commissionRate: Number(row.commission_rate || 10),
    rating: Number(row.rating || 0), status: String(row.status || "active") as DbSeller["status"], createdAt: String(row.created_at),
  };
}

export async function getSellers() { return (await q("SELECT * FROM sellers ORDER BY created_at DESC")).map(rowToSeller); }
export async function getSellerById(sellerId: string) { const row = await one("SELECT * FROM sellers WHERE id=$1", [sellerId]); return row ? rowToSeller(row) : null; }
export async function getSellerByUserId(userId: string) { const row = await one("SELECT * FROM sellers WHERE user_id=$1", [userId]); return row ? rowToSeller(row) : null; }

export async function saveSeller(input: {
  id?: string; storeName: string; contactName: string; email: string; password?: string; phone?: string | null; logoUrl?: string | null;
  coverUrl?: string | null; description?: string | null; returnPolicy?: string | null; shippingDelay?: string | null; commissionRate?: number | null; status?: DbSeller["status"];
}) {
  const current = input.id ? await getSellerById(input.id) : null;
  const userId = current?.userId || id();
  const sellerId = current?.id || id();
  const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : null;
  if (!current) {
    await q("INSERT INTO users (id,email,password_hash,name,role,phone,created_at,updated_at) VALUES ($1,$2,$3,$4,'seller',$5,$6,$7)", [userId, input.email, passwordHash || await bcrypt.hash("Seller123456!", 10), input.contactName, input.phone ?? null, now(), now()]);
  } else {
    await q("UPDATE users SET email=$1,name=$2,phone=$3,role='seller',updated_at=$4 WHERE id=$5", [input.email, input.contactName, input.phone ?? null, now(), userId]);
    if (passwordHash) await q("UPDATE users SET password_hash=$1 WHERE id=$2", [passwordHash, userId]);
  }
  await q(
    `INSERT INTO sellers (id,user_id,store_name,slug,contact_name,email,phone,logo_url,cover_url,description,return_policy,shipping_delay,commission_rate,rating,status,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,$14,$15,$16)
     ON CONFLICT (id) DO UPDATE SET store_name=EXCLUDED.store_name,contact_name=EXCLUDED.contact_name,email=EXCLUDED.email,phone=EXCLUDED.phone,logo_url=EXCLUDED.logo_url,cover_url=EXCLUDED.cover_url,description=EXCLUDED.description,return_policy=EXCLUDED.return_policy,shipping_delay=EXCLUDED.shipping_delay,commission_rate=EXCLUDED.commission_rate,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at`,
    [sellerId, userId, input.storeName, current?.slug || `${slugify(input.storeName)}-${sellerId.slice(0, 5)}`, input.contactName, input.email, input.phone ?? null, input.logoUrl ?? null, input.coverUrl ?? null, input.description ?? null, input.returnPolicy ?? null, input.shippingDelay ?? null, input.commissionRate ?? 10, input.status || "active", now(), now()],
  );
  return getSellerById(sellerId);
}

export async function deleteSeller(sellerId: string) {
  const seller = await getSellerById(sellerId);
  if (!seller) return;
  await q("UPDATE products SET seller_id=NULL WHERE seller_id=$1", [sellerId]);
  await q("DELETE FROM sellers WHERE id=$1", [sellerId]);
  await q("DELETE FROM users WHERE id=$1 AND role='seller'", [seller.userId]);
}

export async function updateSellerStatus(sellerId: string, status: DbSeller["status"]) {
  if (!["pending", "active", "suspended", "rejected"].includes(status)) return null;
  await q("UPDATE sellers SET status=$1,updated_at=$2 WHERE id=$3", [status, now(), sellerId]);
  const seller = await getSellerById(sellerId);
  if (seller) await q("UPDATE users SET account_status=$1,updated_at=$2 WHERE id=$3", [status === "active" ? "active" : "suspended", now(), seller.userId]);
  return seller;
}

export async function updateSellerProfile(sellerId: string, input: Partial<Pick<DbSeller, "storeName" | "contactName" | "phone" | "logoUrl" | "coverUrl" | "description" | "returnPolicy" | "shippingDelay">>) {
  const current = await getSellerById(sellerId);
  if (!current) return null;
  const next = { ...current, ...input };
  await q("UPDATE sellers SET store_name=$1,contact_name=$2,phone=$3,logo_url=$4,cover_url=$5,description=$6,return_policy=$7,shipping_delay=$8,updated_at=$9 WHERE id=$10", [next.storeName, next.contactName, next.phone, next.logoUrl, next.coverUrl, next.description, next.returnPolicy, next.shippingDelay, now(), sellerId]);
  await q("UPDATE users SET name=$1,phone=$2,updated_at=$3 WHERE id=$4", [next.contactName, next.phone, now(), current.userId]);
  return getSellerById(sellerId);
}

export async function getSellerStats(sellerId: string) {
  const productRow = await one<{ count: string; stock: number }>("SELECT COUNT(*) AS count, COALESCE(SUM(stock),0) AS stock FROM products WHERE seller_id=$1", [sellerId]);
  const seller = await getSellerById(sellerId);
  const orders = await getAdminOrders();
  const sellerOrders = orders.filter((order) => order.items.some((item) => item.seller === seller?.storeName));
  const revenue = sellerOrders.reduce((sum, order) => sum + order.items.filter((item) => item.seller === seller?.storeName).reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);
  return { products: Number(productRow?.count || 0), stock: Number(productRow?.stock || 0), orders: sellerOrders.length, revenue };
}

export async function getOrdersForSeller(sellerId: string) {
  const seller = await getSellerById(sellerId);
  if (!seller) return [];
  return (await getAdminOrders()).filter((order) => order.items.some((item) => item.seller === seller.storeName));
}

export async function getTicketsForSeller(sellerId: string) {
  const seller = await getSellerById(sellerId);
  if (!seller) return [];
  return (await getSupportTickets()).filter((ticket) => ticket.subject.toLowerCase().includes(seller.storeName.toLowerCase()) || ticket.message.toLowerCase().includes(seller.storeName.toLowerCase()));
}

export async function getCustomers() {
  return (await q("SELECT * FROM users WHERE role='customer' ORDER BY name")).map((row) => mapUser(row)!).filter(Boolean);
}

export async function getCustomerAdminProfile(userId: string) {
  const user = await getUserById(userId);
  if (!user || user.role !== "customer") return null;
  const [addresses, orders, transactions, tickets] = await Promise.all([
    getAddressesForUser(userId), getAllOrdersForUser(userId), getPaymentTransactionsForUser(userId), getSupportTicketsForUser(userId),
  ]);
  return { user, addresses, orders, transactions, tickets };
}

export async function updateCustomerStatus(userId: string, status: "active" | "suspended" | "banned") {
  await q("UPDATE users SET account_status=$1,updated_at=$2 WHERE id=$3 AND role='customer'", [status, now(), userId]);
  return getUserById(userId);
}

export async function updatePaymentTransaction(input: { id: string; status: "paid" | "rejected"; adminNote?: string | null }) {
  const tx = await one<{ id: string; user_id: string | null; order_id: string | null; type: "order" | "recharge"; amount: number }>("SELECT * FROM payment_transactions WHERE id=$1", [input.id]);
  if (!tx) return null;
  await q("UPDATE payment_transactions SET status=$1,admin_note=$2,updated_at=$3 WHERE id=$4", [input.status, input.adminNote ?? null, now(), input.id]);
  if (tx.order_id) {
    const nextOrderStatus = input.status === "paid" ? "En cours" : "Annulée";
    const order = await one<{ total: number }>("SELECT total FROM orders WHERE id=$1", [tx.order_id]);
    const overpayment = input.status === "paid" && tx.user_id && order ? Math.max(0, Number(tx.amount) - Number(order.total)) : 0;
    await q("UPDATE orders SET payment_status=$1,status=$2,fulfillment_status=$3,updated_at=$4 WHERE id=$5", [input.status === "paid" ? "Paid" : "Rejected", nextOrderStatus, nextOrderStatus, now(), tx.order_id]);
    if (overpayment > 0) await q("UPDATE users SET balance=balance+$1,updated_at=$2 WHERE id=$3", [overpayment, now(), tx.user_id]);
    await q("INSERT INTO order_status_history (id,order_id,status,note,created_at) VALUES ($1,$2,$3,$4,$5)", [id(), tx.order_id, nextOrderStatus, [input.adminNote || (input.status === "paid" ? "Paiement confirmé par admin." : "Paiement refusé par admin."), overpayment > 0 ? `Surplus crédité au solde: ${overpayment.toFixed(2)}.` : ""].filter(Boolean).join(" "), now()]);
  }
  if (input.status === "paid" && tx.type === "recharge" && tx.user_id) await q("UPDATE users SET balance=balance+$1,updated_at=$2 WHERE id=$3", [tx.amount, now(), tx.user_id]);
  return (await getPaymentTransactions()).find((item) => item.id === input.id) || null;
}

export async function debitUserBalance(userId: string, amount: number) {
  const user = await getUserById(userId);
  if (!user || user.balance < amount) return false;
  await q("UPDATE users SET balance=balance-$1,updated_at=$2 WHERE id=$3", [amount, now(), userId]);
  return true;
}
