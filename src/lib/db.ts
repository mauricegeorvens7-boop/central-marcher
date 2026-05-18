import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { DatabaseSync } from "node:sqlite";
import { slugify } from "@/lib/data";

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

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
};

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
  history: {
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
  }[];
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

const dbPath = join(process.cwd(), "data", "store.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 5000");

const now = () => new Date().toISOString();
const id = () => randomUUID();

const img = (imageId: string) =>
  `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`;

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','customer','seller')) DEFAULT 'customer',
      phone TEXT,
      profile_photo TEXT,
      notifications TEXT NOT NULL DEFAULT '{"email":true,"sms":false,"deals":true}',
      settings TEXT NOT NULL DEFAULT '{"language":"fr","currency":"CAD","theme":"light"}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      name TEXT NOT NULL,
      line1 TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      phone TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      price REAL NOT NULL,
      promo_price REAL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      benefits_and_usage TEXT,
      seo_title TEXT,
      seo_description TEXT,
      keywords TEXT,
      variants_json TEXT,
      shipping_json TEXT,
      protection_json TEXT,
      marketplace_json TEXT,
      specs_json TEXT,
      discount_json TEXT,
      category_id TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('active','draft','hidden')) DEFAULT 'draft',
      brand TEXT NOT NULL DEFAULT 'Central Market',
      condition TEXT NOT NULL DEFAULT 'New',
      seller_id TEXT,
      color TEXT,
      size TEXT,
      model TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(seller_id) REFERENCES sellers(id)
    );

    CREATE TABLE IF NOT EXISTS sellers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      store_name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      logo_url TEXT,
      cover_url TEXT,
      description TEXT,
      return_policy TEXT,
      shipping_delay TEXT,
      commission_rate REAL NOT NULL DEFAULT 10,
      rating REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending','active','suspended','rejected')) DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      url TEXT NOT NULL,
      public_id TEXT,
      media_type TEXT NOT NULL DEFAULT 'image',
      alt TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      image_url TEXT NOT NULL,
      public_id TEXT,
      product_image_url TEXT,
      product_public_id TEXT,
      cta_text TEXT NOT NULL,
      cta_link TEXT NOT NULL,
      position TEXT NOT NULL CHECK(position IN ('homepage_hero','category_banner','promo_banner')),
      background_color TEXT NOT NULL DEFAULT '#0f5132',
      gradient TEXT,
      image_position TEXT NOT NULL DEFAULT 'right',
      text_position TEXT NOT NULL DEFAULT 'left',
      size TEXT NOT NULL DEFAULT 'large',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      link TEXT,
      image_url TEXT,
      public_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('top_bar','popup','product_promo','homepage_section')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      user_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recently_viewed (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      percent REAL,
      badge TEXT,
      code TEXT,
      start_date TEXT,
      end_date TEXT,
      new_customer_days INTEGER,
      min_amount REAL,
      categories_json TEXT,
      excluded_products_json TEXT,
      usage_count INTEGER NOT NULL DEFAULT 0,
      revenue_generated REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      moncash_enabled INTEGER NOT NULL DEFAULT 0,
      moncash_number TEXT NOT NULL DEFAULT '',
      natcash_enabled INTEGER NOT NULL DEFAULT 0,
      natcash_number TEXT NOT NULL DEFAULT '',
      cash_on_delivery_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      transaction_no TEXT NOT NULL UNIQUE,
      user_id TEXT,
      order_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('order','recharge')),
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      amount REAL NOT NULL,
      payer_phone TEXT,
      proof_url TEXT,
      proof_public_id TEXT,
      admin_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_no TEXT NOT NULL UNIQUE,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  ensureUserColumns();
}

function tableColumns(table: string) {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((column) => column.name);
}

function ensureColumn(table: string, column: string, definition: string) {
  if (!tableColumns(table).includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function ensureSellerRoleSupport() {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql?: string } | undefined;
  if (row?.sql?.includes("'seller'")) return;
  db.exec("PRAGMA foreign_keys = OFF");
  db.exec(`
    BEGIN TRANSACTION;
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','customer','seller')) DEFAULT 'customer',
      phone TEXT,
      profile_photo TEXT,
      notifications TEXT NOT NULL DEFAULT '{"email":true,"sms":false,"deals":true}',
      settings TEXT NOT NULL DEFAULT '{"language":"fr","currency":"CAD","theme":"light"}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      gender TEXT,
      first_name TEXT,
      last_name TEXT,
      birth_date TEXT,
      cover_photo TEXT,
      account_status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT,
      balance REAL NOT NULL DEFAULT 0
    );
    INSERT INTO users_new (
      id,email,password_hash,name,role,phone,profile_photo,notifications,settings,created_at,updated_at,
      gender,first_name,last_name,birth_date,cover_photo,account_status,last_login_at,balance
    )
    SELECT
      id,email,password_hash,name,role,phone,profile_photo,notifications,settings,created_at,updated_at,
      gender,first_name,last_name,birth_date,cover_photo,account_status,last_login_at,balance
    FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    COMMIT;
  `);
  db.exec("PRAGMA foreign_keys = ON");
}

function ensureUserColumns() {
  ensureSellerRoleSupport();
  ensureColumn("users", "phone", "TEXT");
  ensureColumn("users", "profile_photo", "TEXT");
  ensureColumn("users", "gender", "TEXT");
  ensureColumn("users", "first_name", "TEXT");
  ensureColumn("users", "last_name", "TEXT");
  ensureColumn("users", "birth_date", "TEXT");
  ensureColumn("users", "cover_photo", "TEXT");
  ensureColumn("users", "account_status", "TEXT NOT NULL DEFAULT 'active'");
  ensureColumn("users", "last_login_at", "TEXT");
  ensureColumn("users", "notifications", "TEXT NOT NULL DEFAULT '{\"email\":true,\"sms\":false,\"deals\":true}'");
  ensureColumn("users", "settings", "TEXT NOT NULL DEFAULT '{\"language\":\"fr\",\"currency\":\"CAD\",\"theme\":\"light\"}'");
  ensureColumn("users", "balance", "REAL NOT NULL DEFAULT 0");
  ensureColumn("orders", "payment_status", "TEXT NOT NULL DEFAULT 'Pending'");
  ensureColumn("orders", "fulfillment_status", "TEXT NOT NULL DEFAULT 'Processing'");
  ensureColumn("orders", "payment_method", "TEXT");
  ensureColumn("orders", "contact_name", "TEXT");
  ensureColumn("orders", "contact_email", "TEXT");
  ensureColumn("orders", "contact_phone", "TEXT");
  ensureColumn("orders", "shipping_address", "TEXT");
  ensureColumn("orders", "items_json", "TEXT");
  ensureColumn("orders", "tracking_note", "TEXT");
  ensureColumn("products", "benefits_and_usage", "TEXT");
  ensureColumn("products", "seo_title", "TEXT");
  ensureColumn("products", "seo_description", "TEXT");
  ensureColumn("products", "keywords", "TEXT");
  ensureColumn("products", "variants_json", "TEXT");
  ensureColumn("products", "shipping_json", "TEXT");
  ensureColumn("products", "protection_json", "TEXT");
  ensureColumn("products", "marketplace_json", "TEXT");
  ensureColumn("products", "specs_json", "TEXT");
  ensureColumn("products", "discount_json", "TEXT");
  ensureColumn("products", "seller_id", "TEXT");
  ensureColumn("product_images", "media_type", "TEXT NOT NULL DEFAULT 'image'");
  ensureColumn("banners", "product_image_url", "TEXT");
  ensureColumn("banners", "product_public_id", "TEXT");
  ensureColumn("banners", "product_images_json", "TEXT");
  ensureColumn("banners", "background_color", "TEXT NOT NULL DEFAULT '#0f5132'");
  ensureColumn("banners", "gradient", "TEXT");
  ensureColumn("banners", "image_position", "TEXT NOT NULL DEFAULT 'right'");
  ensureColumn("banners", "text_position", "TEXT NOT NULL DEFAULT 'left'");
  ensureColumn("banners", "size", "TEXT NOT NULL DEFAULT 'large'");
  const paymentSettings = db.prepare("SELECT id FROM payment_settings WHERE id = 1").get() as { id: number } | undefined;
  if (!paymentSettings) {
    db.prepare("INSERT INTO payment_settings (id,updated_at) VALUES (1,?)").run(now());
  }
  upgradeLegacyHeroBanners();
}

function upgradeLegacyHeroBanners() {
  const legacy = db.prepare("SELECT id FROM banners WHERE title = ? LIMIT 1").get("Fresh tech, sharper prices") as
    | { id: string }
    | undefined;
  if (!legacy) return;

  const presets = [
    {
      id: legacy.id,
      title: "Selection signature",
      subtitle: "Des trouvailles maison, techno et style choisies pour magasiner autrement.",
      imageUrl: img("photo-1559056199-641a0ac8b55e"),
      productImageUrl: img("photo-1517668808822-9ebb02f2a0e6"),
      ctaText: "Magasinez",
      ctaLink: "/deals",
      backgroundColor: "#0f5132",
      gradient: "radial-gradient(circle at 78% 20%, rgba(245, 158, 11, 0.42), transparent 28%), linear-gradient(135deg, #0b3d2e 0%, #0f766e 52%, #92400e 100%)",
      imagePosition: "top",
      textPosition: "center",
      size: "large",
    },
    {
      id: id(),
      title: "Maison connectee",
      subtitle: "Des essentiels pratiques, beaux et rapides a recuperer en magasin.",
      imageUrl: img("photo-1544787219-7f47ccb76574"),
      productImageUrl: img("photo-1505740420928-5e560c06d30e"),
      ctaText: "Magasinez",
      ctaLink: "/products",
      backgroundColor: "#4c1d2f",
      gradient: "radial-gradient(circle at 82% 35%, rgba(251, 191, 36, 0.38), transparent 30%), linear-gradient(135deg, #4c1d2f 0%, #7f1d1d 48%, #b45309 100%)",
      imagePosition: "right",
      textPosition: "left",
      size: "medium",
    },
    {
      id: id(),
      title: "Coin economique",
      subtitle: "Boite ouverte, remis a neuf et offres limitees avec une presentation claire.",
      imageUrl: img("photo-1519389950473-47ba0277781c"),
      productImageUrl: "",
      ctaText: "Magasinez",
      ctaLink: "/open-box",
      backgroundColor: "#312e81",
      gradient: "linear-gradient(135deg, #312e81 0%, #7e22ce 46%, #be123c 100%)",
      imagePosition: "right",
      textPosition: "center",
      size: "small",
    },
    {
      id: id(),
      title: "Mobilite futée",
      subtitle: "Tablettes, accessoires et appareils compacts pour le quotidien.",
      imageUrl: img("photo-1542751110-97427bbecf20"),
      productImageUrl: img("photo-1544244015-0df4b3ffc6b0"),
      ctaText: "Magasinez",
      ctaLink: "/category/computers-tablets",
      backgroundColor: "#334155",
      gradient: "radial-gradient(circle at 72% 28%, rgba(20, 184, 166, 0.45), transparent 28%), linear-gradient(135deg, #1f2937 0%, #334155 52%, #0f766e 100%)",
      imagePosition: "top",
      textPosition: "center",
      size: "small",
    },
  ];

  db.prepare(`
    UPDATE banners SET title=?, subtitle=?, image_url=?, product_image_url=?, cta_text=?, cta_link=?, position='homepage_hero',
    background_color=?, gradient=?, image_position=?, text_position=?, size=?, active=1, updated_at=? WHERE id=?
  `).run(
    presets[0].title,
    presets[0].subtitle,
    presets[0].imageUrl,
    presets[0].productImageUrl,
    presets[0].ctaText,
    presets[0].ctaLink,
    presets[0].backgroundColor,
    presets[0].gradient,
    presets[0].imagePosition,
    presets[0].textPosition,
    presets[0].size,
    now(),
    presets[0].id,
  );

  const insert = db.prepare(`
    INSERT INTO banners (id,title,subtitle,image_url,product_image_url,cta_text,cta_link,position,background_color,gradient,image_position,text_position,size,active,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  presets.slice(1).forEach((preset) => {
    insert.run(
      preset.id,
      preset.title,
      preset.subtitle,
      preset.imageUrl,
      preset.productImageUrl,
      preset.ctaText,
      preset.ctaLink,
      "homepage_hero",
      preset.backgroundColor,
      preset.gradient,
      preset.imagePosition,
      preset.textPosition,
      preset.size,
      1,
      now(),
      now(),
    );
  });
}

export async function seedDb() {
  initDb();
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    const passwordHash = await bcrypt.hash("Admin123456!", 12);
    db.prepare(
      "INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run(
      id(),
      "admin@store.com",
      passwordHash,
      "Store Admin",
      "admin",
      "+1 555 0100",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      now(),
      now(),
    );
  }

  const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number };
  if (categoryCount.count === 0) {
    [
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
    ].forEach((name) => {
      db.prepare("INSERT INTO categories (id,name,slug,created_at,updated_at) VALUES (?,?,?,?,?)").run(
        id(),
        name,
        slugify(name),
        now(),
        now(),
      );
    });
  }

  const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  if (productCount.count === 0) {
    const samples = [
      ["Aurora X1 14-inch OLED Ultrabook", "AUR-X1-512", 1499.99, 1199.99, "Computers & Tablets", "Northstar", 42, img("photo-1496181133206-80ce9b88a853")],
      ["Vista 65-inch QLED 4K Smart TV", "VIS-65Q-2026", 1199.99, 899.99, "TV & Home Theater", "Lumio", 18, img("photo-1593784991095-a205069470b6")],
      ["PulseBuds Pro Noise Cancelling Earbuds", "PBP-WHT-02", 219.99, 149.99, "Audio", "Sonicwell", 67, img("photo-1606220945770-b5b6c2c55bf1")],
      ["ForgeBox Series G Console 1TB", "FBG-1TB", 499.99, null, "Gaming", "Forge", 12, img("photo-1606813907291-d86efa9b94db")],
    ] as const;

    for (const sample of samples) {
      const category = getCategoryBySlug(slugify(sample[4]));
      if (!category) continue;
      const productId = id();
      db.prepare(`
        INSERT INTO products
        (id,name,slug,sku,price,promo_price,short_description,description,category_id,stock,status,brand,condition,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        productId,
        sample[0],
        slugify(sample[0]),
        sample[1],
        sample[2],
        sample[3],
        "Admin-editable product saved in SQLite.",
        "Full product description managed from the admin dashboard.",
        category.id,
        sample[6],
        "active",
        sample[5],
        sample[0].includes("PulseBuds") ? "Open Box Excellent" : "New",
        now(),
        now(),
      );
      db.prepare("INSERT INTO product_images (id,product_id,url,alt,sort_order,created_at) VALUES (?,?,?,?,?,?)").run(
        id(),
        productId,
        sample[7],
        sample[0],
        0,
        now(),
      );
    }
  }

  const bannerCount = db.prepare("SELECT COUNT(*) AS count FROM banners").get() as { count: number };
  if (bannerCount.count === 0) {
    const insertBanner = db.prepare(`
      INSERT INTO banners (id,title,subtitle,image_url,product_image_url,cta_text,cta_link,position,background_color,gradient,image_position,text_position,size,active,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    [
      ["Selection signature", "Des trouvailles maison, techno et style choisies pour magasiner autrement.", img("photo-1559056199-641a0ac8b55e"), img("photo-1517668808822-9ebb02f2a0e6"), "Magasinez", "/deals", "#0f5132", "radial-gradient(circle at 78% 20%, rgba(245, 158, 11, 0.42), transparent 28%), linear-gradient(135deg, #0b3d2e 0%, #0f766e 52%, #92400e 100%)", "top", "center", "large"],
      ["Maison connectee", "Des essentiels pratiques, beaux et rapides a recuperer en magasin.", img("photo-1544787219-7f47ccb76574"), img("photo-1505740420928-5e560c06d30e"), "Magasinez", "/products", "#4c1d2f", "radial-gradient(circle at 82% 35%, rgba(251, 191, 36, 0.38), transparent 30%), linear-gradient(135deg, #4c1d2f 0%, #7f1d1d 48%, #b45309 100%)", "right", "left", "medium"],
      ["Coin economique", "Boite ouverte, remis a neuf et offres limitees avec une presentation claire.", img("photo-1519389950473-47ba0277781c"), "", "Magasinez", "/open-box", "#312e81", "linear-gradient(135deg, #312e81 0%, #7e22ce 46%, #be123c 100%)", "right", "center", "small"],
      ["Mobilite futée", "Tablettes, accessoires et appareils compacts pour le quotidien.", img("photo-1542751110-97427bbecf20"), img("photo-1544244015-0df4b3ffc6b0"), "Magasinez", "/category/computers-tablets", "#334155", "radial-gradient(circle at 72% 28%, rgba(20, 184, 166, 0.45), transparent 28%), linear-gradient(135deg, #1f2937 0%, #334155 52%, #0f766e 100%)", "top", "center", "small"],
    ].forEach(([title, subtitle, imageUrl, productImageUrl, ctaText, ctaLink, backgroundColor, gradient, imagePosition, textPosition, size]) => {
      insertBanner.run(id(), title, subtitle, imageUrl, productImageUrl, ctaText, ctaLink, "homepage_hero", backgroundColor, gradient, imagePosition, textPosition, size, 1, now(), now());
    });
  }

  const announcementCount = db.prepare("SELECT COUNT(*) AS count FROM announcements").get() as { count: number };
  if (announcementCount.count === 0) {
    db.prepare(`
      INSERT INTO announcements (id,text,link,type,start_date,end_date,active,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      id(),
      "Free shipping on eligible orders over $250",
      "/delivery-pickup",
      "top_bar",
      "2026-01-01",
      "2027-01-01",
      1,
      now(),
      now(),
    );
  }

  const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number };
  if (orderCount.count === 0) {
    db.prepare("INSERT INTO orders (id,order_no,status,total,created_at,updated_at) VALUES (?,?,?,?,?,?)").run(
      id(),
      "ORD-10482",
      "paid",
      1349.98,
      now(),
      now(),
    );
  }
}

initDb();

function rowToProduct(row: Record<string, unknown>): DbProduct {
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
    status: row.status as DbProduct["status"],
    brand: String(row.brand),
    condition: String(row.condition),
    color: row.color == null ? null : String(row.color),
    size: row.size == null ? null : String(row.size),
    model: row.model == null ? null : String(row.model),
    sellerId: row.seller_id == null ? null : String(row.seller_id),
    createdAt: String(row.created_at),
    images: [],
  };
  product.images = getProductImages(product.id);
  return product;
}

export function getAdminByEmail(email: string) {
  return db.prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'").get(email) as
    | { id: string; email: string; password_hash: string; name: string; role: "admin" }
    | undefined;
}

export function getUserByEmail(email: string) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | { id: string; email: string; password_hash: string; name: string; role: UserRole; account_status?: string }
    | undefined;
}

export function getUserById(idValue: string) {
  return db
    .prepare("SELECT id,email,name,role,phone,profile_photo AS profilePhoto,gender,first_name AS firstName,last_name AS lastName,birth_date AS birthDate,cover_photo AS coverPhoto,account_status AS accountStatus,notifications,settings,balance FROM users WHERE id = ?")
    .get(idValue) as
    | DbUser
    | undefined;
}

export function updateUserProfile(userId: string, input: {
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
  const user = getUserById(userId);
  if (!user) return null;
  const firstName = input.firstName?.trim() || user.firstName || user.name.split(" ")[0] || user.name;
  const lastName = input.lastName?.trim() || user.lastName || user.name.split(" ").slice(1).join(" ");
  const settings = JSON.parse(user.settings || "{}") as Record<string, unknown>;
  if (input.language) settings.language = input.language;
  db.prepare(`
    UPDATE users SET first_name=?, last_name=?, name=?, gender=?, birth_date=?, phone=?, email=?, profile_photo=?, cover_photo=?, settings=?, updated_at=?
    WHERE id=?
  `).run(
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
  );
  return getUserById(userId);
}

export async function changeUserPassword(userId: string, currentPassword: string, nextPassword: string) {
  const row = db.prepare("SELECT password_hash FROM users WHERE id=?").get(userId) as { password_hash: string } | undefined;
  if (!row) return { ok: false, error: "Utilisateur introuvable." };
  const valid = await bcrypt.compare(currentPassword, row.password_hash);
  if (!valid) return { ok: false, error: "Mot de passe actuel incorrect." };
  const hash = await bcrypt.hash(nextPassword, 12);
  db.prepare("UPDATE users SET password_hash=?, updated_at=? WHERE id=?").run(hash, now(), userId);
  return { ok: true };
}

export function saveUserAddress(userId: string, input: {
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
  if (input.isDefault) db.prepare("UPDATE user_addresses SET is_default=0 WHERE user_id=?").run(userId);
  if (input.id) {
    db.prepare("UPDATE user_addresses SET label=?,name=?,line1=?,city=?,province=?,postal_code=?,phone=?,is_default=? WHERE id=? AND user_id=?").run(
      input.label,
      input.name,
      input.line1,
      input.city,
      input.province,
      input.postalCode,
      input.phone || null,
      input.isDefault ? 1 : 0,
      input.id,
      userId,
    );
    return input.id;
  }
  const addressId = id();
  db.prepare("INSERT INTO user_addresses (id,user_id,label,name,line1,city,province,postal_code,phone,is_default,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
    addressId,
    userId,
    input.label,
    input.name,
    input.line1,
    input.city,
    input.province,
    input.postalCode,
    input.phone || null,
    input.isDefault ? 1 : 0,
    now(),
  );
  return addressId;
}

export function deleteUserAddress(userId: string, addressId: string) {
  db.prepare("DELETE FROM user_addresses WHERE id=? AND user_id=?").run(addressId, userId);
}

export async function createCustomer(input: { name: string; email: string; password: string; phone?: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const userId = id();
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  db.prepare(
    "INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,first_name,last_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  ).run(
    userId,
    input.email,
    passwordHash,
    input.name,
    "customer",
    input.phone || null,
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    firstName || input.name,
    rest.join(" "),
    now(),
    now(),
  );
  db.prepare("INSERT INTO user_addresses (id,user_id,label,name,line1,city,province,postal_code,phone,is_default,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
    id(),
    userId,
    "Maison",
    input.name,
    "123 Rue Centrale",
    "Montreal",
    "QC",
    "H2X 1Y4",
    input.phone || null,
    1,
    now(),
  );
  return getUserById(userId);
}

export function getCategories() {
  return (db.prepare("SELECT id,name,slug FROM categories ORDER BY name").all() as DbCategory[]).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));
}

export function getCategoryBySlug(slug: string) {
  return db.prepare("SELECT id,name,slug FROM categories WHERE slug = ?").get(slug) as DbCategory | undefined;
}

export function getProducts(options: { includeHidden?: boolean; categorySlug?: string; sellerId?: string } = {}) {
  const where = [];
  const values: unknown[] = [];
  if (!options.includeHidden) where.push("p.status = 'active'");
  if (options.sellerId) {
    where.push("p.seller_id = ?");
    values.push(options.sellerId);
  }
  if (options.categorySlug) {
    where.push("c.slug = ?");
    values.push(options.categorySlug);
  }
  const rows = db
    .prepare(
      `
        SELECT p.*, c.name AS category_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY p.created_at DESC
      `,
    )
    .all(...values) as Record<string, unknown>[];
  return rows.map(rowToProduct);
}

export function getProductBySlug(slug: string) {
  const row = db
    .prepare("SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.slug = ?")
    .get(slug) as Record<string, unknown> | undefined;
  return row ? rowToProduct(row) : undefined;
}

export function getProductById(productId: string) {
  const row = db
    .prepare("SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?")
    .get(productId) as Record<string, unknown> | undefined;
  return row ? rowToProduct(row) : undefined;
}

export function getProductImages(productId: string) {
  return (db
    .prepare("SELECT id, product_id AS productId, url, public_id AS publicId, media_type AS mediaType, alt, sort_order AS sortOrder FROM product_images WHERE product_id = ? ORDER BY sort_order")
    .all(productId) as DbProductImage[]).map((image) => ({
    id: image.id,
    productId: image.productId,
    url: image.url,
    publicId: image.publicId,
    mediaType: image.mediaType || "image",
    alt: image.alt,
    sortOrder: image.sortOrder,
  }));
}

export function saveProduct(input: {
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
  const baseSlug = slugify(input.name);
  const slug = input.id ? baseSlug : `${baseSlug}-${productId.slice(0, 6)}`;
  if (input.id) {
    db.prepare(`
      UPDATE products SET name=?, slug=?, sku=?, price=?, promo_price=?, short_description=?, description=?, category_id=?,
      stock=?, status=?, brand=?, condition=?, color=?, size=?, model=?, benefits_and_usage=?, seo_title=?, seo_description=?, keywords=?,
      variants_json=?, shipping_json=?, protection_json=?, marketplace_json=?, specs_json=?, discount_json=?, seller_id=?, updated_at=? WHERE id=?
    `).run(
      input.name,
      slug,
      input.sku,
      input.price,
      input.promoPrice ?? null,
      input.shortDescription,
      input.description,
      input.categoryId,
      input.stock,
      input.status,
      input.brand,
      input.condition,
      input.color ?? null,
      input.size ?? null,
      input.model ?? null,
      input.benefitsAndUsage ?? null,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      input.keywords ?? null,
      input.variantsJson ?? null,
      input.shippingJson ?? null,
      input.protectionJson ?? null,
      input.marketplaceJson ?? null,
      input.specsJson ?? null,
      input.discountJson ?? null,
      input.sellerId ?? null,
      now(),
      productId,
    );
    db.prepare("DELETE FROM product_images WHERE product_id = ?").run(productId);
  } else {
    db.prepare(`
      INSERT INTO products (id,name,slug,sku,price,promo_price,short_description,description,category_id,stock,status,brand,condition,color,size,model,benefits_and_usage,seo_title,seo_description,keywords,variants_json,shipping_json,protection_json,marketplace_json,specs_json,discount_json,seller_id,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      productId,
      input.name,
      slug,
      input.sku,
      input.price,
      input.promoPrice ?? null,
      input.shortDescription,
      input.description,
      input.categoryId,
      input.stock,
      input.status,
      input.brand,
      input.condition,
      input.color ?? null,
      input.size ?? null,
      input.model ?? null,
      input.benefitsAndUsage ?? null,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      input.keywords ?? null,
      input.variantsJson ?? null,
      input.shippingJson ?? null,
      input.protectionJson ?? null,
      input.marketplaceJson ?? null,
      input.specsJson ?? null,
      input.discountJson ?? null,
      input.sellerId ?? null,
      now(),
      now(),
    );
  }
  input.images.forEach((image, index) => {
    if (!image.url) return;
    db.prepare("INSERT INTO product_images (id,product_id,url,public_id,media_type,alt,sort_order,created_at) VALUES (?,?,?,?,?,?,?,?)").run(
      id(),
      productId,
      image.url,
      image.publicId ?? null,
      image.mediaType || "image",
      input.name,
      index,
      now(),
    );
  });
  return getProductById(productId);
}

export function deleteProduct(productId: string) {
  db.prepare("DELETE FROM products WHERE id = ?").run(productId);
}

export function getBanners(includeInactive = false) {
  return (db
    .prepare(`SELECT id,title,subtitle,image_url AS imageUrl,public_id AS publicId,product_image_url AS productImageUrl,product_public_id AS productPublicId,product_images_json AS productImagesJson,cta_text AS ctaText,cta_link AS ctaLink,position,background_color AS backgroundColor,gradient,image_position AS imagePosition,text_position AS textPosition,size,active,created_at AS createdAt FROM banners ${includeInactive ? "" : "WHERE active = 1"} ORDER BY created_at DESC`)
    .all() as (DbBanner & { productImagesJson?: string | null })[]).map((banner) => {
    let productImages: { url: string; publicId?: string | null }[] = [];
    try {
      productImages = JSON.parse(banner.productImagesJson || "[]") as { url: string; publicId?: string | null }[];
    } catch {
      productImages = [];
    }
    if (!productImages.length && banner.productImageUrl) {
      productImages = [{ url: banner.productImageUrl, publicId: banner.productPublicId }];
    }
    return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.imageUrl,
    publicId: banner.publicId,
    productImageUrl: banner.productImageUrl,
    productPublicId: banner.productPublicId,
    productImages,
    ctaText: banner.ctaText,
    ctaLink: banner.ctaLink,
    position: banner.position,
    backgroundColor: banner.backgroundColor,
    gradient: banner.gradient,
    imagePosition: banner.imagePosition,
    textPosition: banner.textPosition,
    size: banner.size,
    active: banner.active,
    createdAt: banner.createdAt,
  };
  });
}

export function saveBanner(input: {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  publicId?: string | null;
  productImageUrl?: string | null;
  productPublicId?: string | null;
  productImages?: { url: string; publicId?: string | null }[];
  ctaText: string;
  ctaLink: string;
  position: DbBanner["position"];
  backgroundColor?: string;
  gradient?: string | null;
  imagePosition?: DbBanner["imagePosition"];
  textPosition?: DbBanner["textPosition"];
  size?: DbBanner["size"];
  active: boolean | number;
}) {
  const bannerId = input.id || id();
  const productImages = input.productImages?.length
    ? input.productImages.filter((image) => image.url)
    : input.productImageUrl
      ? [{ url: input.productImageUrl, publicId: input.productPublicId }]
      : [];
  const primaryProductImage = productImages[0];
  if (input.id) {
    db.prepare("UPDATE banners SET title=?,subtitle=?,image_url=?,public_id=?,product_image_url=?,product_public_id=?,product_images_json=?,cta_text=?,cta_link=?,position=?,background_color=?,gradient=?,image_position=?,text_position=?,size=?,active=?,updated_at=? WHERE id=?").run(
      input.title,
      input.subtitle,
      input.imageUrl,
      input.publicId ?? null,
      primaryProductImage?.url ?? null,
      primaryProductImage?.publicId ?? null,
      JSON.stringify(productImages),
      input.ctaText,
      input.ctaLink,
      input.position,
      input.backgroundColor || "#0f5132",
      input.gradient || null,
      input.imagePosition || "right",
      input.textPosition || "left",
      input.size || "large",
      input.active ? 1 : 0,
      now(),
      bannerId,
    );
  } else {
    db.prepare("INSERT INTO banners (id,title,subtitle,image_url,public_id,product_image_url,product_public_id,product_images_json,cta_text,cta_link,position,background_color,gradient,image_position,text_position,size,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
      bannerId,
      input.title,
      input.subtitle,
      input.imageUrl,
      input.publicId ?? null,
      primaryProductImage?.url ?? null,
      primaryProductImage?.publicId ?? null,
      JSON.stringify(productImages),
      input.ctaText,
      input.ctaLink,
      input.position,
      input.backgroundColor || "#0f5132",
      input.gradient || null,
      input.imagePosition || "right",
      input.textPosition || "left",
      input.size || "large",
      input.active ? 1 : 0,
      now(),
      now(),
    );
  }
}

export function deleteBanner(bannerId: string) {
  db.prepare("DELETE FROM banners WHERE id = ?").run(bannerId);
}

export function getAnnouncements(includeInactive = false) {
  return (db
    .prepare(`SELECT id,text,link,image_url AS imageUrl,public_id AS publicId,type,start_date AS startDate,end_date AS endDate,active,created_at AS createdAt FROM announcements ${includeInactive ? "" : "WHERE active = 1 AND date('now') BETWEEN date(start_date) AND date(end_date)"} ORDER BY created_at DESC`)
    .all() as DbAnnouncement[]).map((announcement) => ({
    id: announcement.id,
    text: announcement.text,
    link: announcement.link,
    imageUrl: announcement.imageUrl,
    publicId: announcement.publicId,
    type: announcement.type,
    startDate: announcement.startDate,
    endDate: announcement.endDate,
    active: announcement.active,
    createdAt: announcement.createdAt,
  }));
}

export function saveAnnouncement(input: {
  id?: string;
  text: string;
  link?: string | null;
  imageUrl?: string | null;
  publicId?: string | null;
  type: DbAnnouncement["type"];
  startDate: string;
  endDate: string;
  active: boolean | number;
}) {
  const announcementId = input.id || id();
  if (input.id) {
    db.prepare("UPDATE announcements SET text=?,link=?,image_url=?,public_id=?,type=?,start_date=?,end_date=?,active=?,updated_at=? WHERE id=?").run(
      input.text,
      input.link ?? null,
      input.imageUrl ?? null,
      input.publicId ?? null,
      input.type,
      input.startDate,
      input.endDate,
      input.active ? 1 : 0,
      now(),
      announcementId,
    );
  } else {
    db.prepare("INSERT INTO announcements (id,text,link,image_url,public_id,type,start_date,end_date,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
      announcementId,
      input.text,
      input.link ?? null,
      input.imageUrl ?? null,
      input.publicId ?? null,
      input.type,
      input.startDate,
      input.endDate,
      input.active ? 1 : 0,
      now(),
      now(),
    );
  }
}

export function deleteAnnouncement(announcementId: string) {
  db.prepare("DELETE FROM announcements WHERE id = ?").run(announcementId);
}

export function getOrders() {
  return (db.prepare("SELECT id, order_no AS orderNo, status, payment_status AS paymentStatus, fulfillment_status AS fulfillmentStatus, total, created_at AS createdAt FROM orders ORDER BY created_at DESC").all() as {
    id: string;
    orderNo: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    total: number;
    createdAt: string;
  }[]).map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    createdAt: order.createdAt,
  }));
}

function parseOrderItems(itemsJson: string | null): AdminOrderItem[] {
  try {
    const parsed = JSON.parse(itemsJson || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: item.id ? String(item.id) : undefined,
      productId: item.productId ? String(item.productId) : undefined,
      slug: item.slug ? String(item.slug) : undefined,
      name: item.name ? String(item.name) : "Produit",
      brand: item.brand ? String(item.brand) : undefined,
      image: item.image ? String(item.image) : undefined,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      sku: item.sku ? String(item.sku) : undefined,
      variantLabel: item.variantLabel ? String(item.variantLabel) : undefined,
      seller: item.seller ? String(item.seller) : undefined,
    }));
  } catch {
    return [];
  }
}

function rowToAdminOrder(row: Record<string, unknown>): AdminOrder {
  return {
    id: String(row.id),
    orderNo: String(row.orderNo),
    status: String(row.status || ""),
    paymentStatus: String(row.paymentStatus || ""),
    fulfillmentStatus: String(row.fulfillmentStatus || ""),
    paymentMethod: row.paymentMethod == null ? null : String(row.paymentMethod),
    total: Number(row.total || 0),
    customerName: String(row.customerName || row.userName || "Client"),
    customerEmail: String(row.customerEmail || row.userEmail || ""),
    customerPhone: String(row.customerPhone || row.userPhone || ""),
    shippingAddress: String(row.shippingAddress || ""),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt || row.createdAt),
    user: {
      id: row.userId == null ? null : String(row.userId),
      name: row.userName == null ? null : String(row.userName),
      email: row.userEmail == null ? null : String(row.userEmail),
      phone: row.userPhone == null ? null : String(row.userPhone),
      profilePhoto: row.profilePhoto == null ? null : String(row.profilePhoto),
      gender: row.gender == null ? null : String(row.gender),
    },
    items: parseOrderItems(row.itemsJson == null ? null : String(row.itemsJson)),
    paymentProof: {
      transactionNo: row.transactionNo == null ? null : String(row.transactionNo),
      proofUrl: row.proofUrl == null ? null : String(row.proofUrl),
      payerPhone: row.payerPhone == null ? null : String(row.payerPhone),
      adminNote: row.adminNote == null ? null : String(row.adminNote),
      status: row.transactionStatus == null ? null : String(row.transactionStatus),
    },
    history: [],
  };
}

export function getAdminOrders(): AdminOrder[] {
  const rows = db
    .prepare(`
      SELECT o.id, o.order_no AS orderNo, o.status, o.payment_status AS paymentStatus, o.fulfillment_status AS fulfillmentStatus,
      o.payment_method AS paymentMethod, o.total, o.contact_name AS customerName, o.contact_email AS customerEmail,
      o.contact_phone AS customerPhone, o.shipping_address AS shippingAddress, o.items_json AS itemsJson,
      o.created_at AS createdAt, o.updated_at AS updatedAt, u.id AS userId, u.name AS userName, u.email AS userEmail,
      u.phone AS userPhone, u.profile_photo AS profilePhoto, u.gender,
      pt.transaction_no AS transactionNo, pt.proof_url AS proofUrl, pt.payer_phone AS payerPhone, pt.admin_note AS adminNote,
      pt.status AS transactionStatus
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN payment_transactions pt ON pt.order_id = o.id
      ORDER BY o.created_at DESC
    `)
    .all() as Record<string, unknown>[];
  return rows.map(rowToAdminOrder);
}

export function getAdminOrderById(orderId: string): AdminOrder | null {
  const row = db
    .prepare(`
      SELECT o.id, o.order_no AS orderNo, o.status, o.payment_status AS paymentStatus, o.fulfillment_status AS fulfillmentStatus,
      o.payment_method AS paymentMethod, o.total, o.contact_name AS customerName, o.contact_email AS customerEmail,
      o.contact_phone AS customerPhone, o.shipping_address AS shippingAddress, o.items_json AS itemsJson,
      o.created_at AS createdAt, o.updated_at AS updatedAt, u.id AS userId, u.name AS userName, u.email AS userEmail,
      u.phone AS userPhone, u.profile_photo AS profilePhoto, u.gender,
      pt.transaction_no AS transactionNo, pt.proof_url AS proofUrl, pt.payer_phone AS payerPhone, pt.admin_note AS adminNote,
      pt.status AS transactionStatus
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN payment_transactions pt ON pt.order_id = o.id
      WHERE o.id = ?
      LIMIT 1
    `)
    .get(orderId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const order = rowToAdminOrder(row);
  order.history = (db
    .prepare("SELECT id,status,note,created_at AS createdAt FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC")
    .all(orderId) as { id: string; status: string; note: string | null; createdAt: string }[]).map((item) => ({ ...item }));
  return order;
}

export function updateOrderStatus(input: { id: string; status: string; note?: string | null }) {
  const allowed = ["Nouvelle commande", "En cours", "En livraison", "Livrée", "Annulée"];
  if (!allowed.includes(input.status)) return null;
  const order = getAdminOrderById(input.id);
  if (!order) return null;

  const paymentStatus = input.status === "Annulée" && order.paymentStatus !== "Paid" ? "Rejected" : order.paymentStatus;
  db.prepare("UPDATE orders SET status=?, fulfillment_status=?, payment_status=?, tracking_note=?, updated_at=? WHERE id=?").run(
    input.status,
    input.status,
    paymentStatus,
    input.note ?? null,
    now(),
    input.id,
  );
  db.prepare("INSERT INTO order_status_history (id,order_id,status,note,created_at) VALUES (?,?,?,?,?)").run(
    id(),
    input.id,
    input.status,
    input.note ?? null,
    now(),
  );
  return getAdminOrderById(input.id);
}

export function getOrdersForUser(userId: string, limit = 5) {
  const user = getUserById(userId);
  const rows = db
    .prepare("SELECT id, order_no AS orderNo, status, payment_status AS paymentStatus, fulfillment_status AS fulfillmentStatus, total, created_at AS createdAt FROM orders WHERE user_id = ? OR contact_email = ? ORDER BY created_at DESC LIMIT ?")
    .all(userId, user?.email || "", limit) as {
    id: string;
    orderNo: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    total: number;
    createdAt: string;
  }[];
  return rows.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    createdAt: order.createdAt,
  }));
}

export function getAllOrdersForUser(userId: string) {
  return getOrdersForUser(userId, 100);
}

export function getAccountAlertSnapshot(userId: string) {
  const user = getUserById(userId);
  const orders = db
    .prepare(`
      SELECT o.id, o.payment_status AS paymentStatus, o.fulfillment_status AS fulfillmentStatus, o.updated_at AS updatedAt,
        (
          SELECT h.status FROM order_status_history h
          WHERE h.order_id = o.id
          ORDER BY h.created_at DESC
          LIMIT 1
        ) AS latestHistoryStatus,
        (
          SELECT h.created_at FROM order_status_history h
          WHERE h.order_id = o.id
          ORDER BY h.created_at DESC
          LIMIT 1
        ) AS latestHistoryAt
      FROM orders o
      WHERE o.user_id = ? OR o.contact_email = ?
      ORDER BY o.updated_at DESC
      LIMIT 100
    `)
    .all(userId, user?.email || "") as {
    id: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    updatedAt: string;
    latestHistoryStatus: string | null;
    latestHistoryAt: string | null;
  }[];
  const transactions = db
    .prepare("SELECT id,type,method,status,updated_at AS updatedAt FROM payment_transactions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100")
    .all(userId) as { id: string; type: string; method: string; status: string; updatedAt: string }[];
  const orderSignature = orders
    .map((order) => `${order.id}:${order.paymentStatus}:${order.fulfillmentStatus}:${order.updatedAt}:${order.latestHistoryStatus || ""}:${order.latestHistoryAt || ""}`)
    .sort()
    .join("|");
  const transactionSignature = transactions.map((tx) => `${tx.id}:${tx.type}:${tx.method}:${tx.status}:${tx.updatedAt}`).sort().join("|");
  const latestOrder = orders[0];
  const latestTransaction = transactions[0];
  return {
    signature: `${orderSignature}::${transactionSignature}`,
    latestOrderStatus: latestOrder?.latestHistoryStatus || latestOrder?.fulfillmentStatus || "",
    latestTransactionStatus: latestTransaction?.status || "",
  };
}

export function getOrderForUserById(userId: string, orderId: string) {
  const user = getUserById(userId);
  const order = getAdminOrderById(orderId);
  if (!order) return null;
  if (order.user.id === userId || (user?.email && order.customerEmail === user.email)) return order;
  return null;
}

export function getAddressesForUser(userId: string) {
  return (db
    .prepare("SELECT id,label,name,line1,city,province,postal_code AS postalCode,phone,is_default AS isDefault FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC")
    .all(userId) as {
    id: string;
    label: string;
    name: string;
    line1: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string | null;
    isDefault: number;
  }[]).map((address) => ({
    id: address.id,
    label: address.label,
    name: address.name,
    line1: address.line1,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    phone: address.phone,
    isDefault: address.isDefault,
  }));
}

export function getFavoritesForUser(userId: string) {
  const favorites = db
    .prepare(`
      SELECT p.*, c.name AS category_name
      FROM favorites f
      JOIN products p ON p.id = f.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `)
    .all(userId) as Record<string, unknown>[];
  const rows = favorites.length
    ? favorites
    : (db
        .prepare("SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.status='active' ORDER BY p.created_at DESC LIMIT 3")
        .all() as Record<string, unknown>[]);
  return rows.map(rowToProduct);
}

export function getRecentlyViewedForUser(userId: string) {
  const viewed = db
    .prepare(`
      SELECT p.*, c.name AS category_name
      FROM recently_viewed r
      JOIN products p ON p.id = r.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE r.user_id = ?
      ORDER BY r.viewed_at DESC
      LIMIT 3
    `)
    .all(userId) as Record<string, unknown>[];
  const rows = viewed.length
    ? viewed
    : (db
        .prepare("SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.status='active' ORDER BY p.created_at ASC LIMIT 3")
        .all() as Record<string, unknown>[]);
  return rows.map(rowToProduct);
}

export function getAdminStats() {
  const totalProducts = (db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number }).count;
  const totalOrders = (db.prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number }).count;
  const totalSales = (db.prepare("SELECT COALESCE(SUM(total),0) AS total FROM orders").get() as { total: number }).total;
  return { totalProducts, totalOrders, totalSales };
}

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

export function getDiscounts(includeDisabled = true) {
  return (db
    .prepare(`SELECT id,name,type,enabled,percent,badge,code,start_date AS startDate,end_date AS endDate,new_customer_days AS newCustomerDays,min_amount AS minAmount,categories_json AS categoriesJson,excluded_products_json AS excludedProductsJson,usage_count AS usageCount,revenue_generated AS revenueGenerated,created_at AS createdAt FROM discounts ${includeDisabled ? "" : "WHERE enabled = 1"} ORDER BY created_at DESC`)
    .all() as DbDiscount[]).map((discount) => ({ ...discount }));
}

export function saveDiscount(input: Partial<DbDiscount> & { name: string; type: string }) {
  const discountId = input.id || id();
  if (input.id) {
    db.prepare("UPDATE discounts SET name=?,type=?,enabled=?,percent=?,badge=?,code=?,start_date=?,end_date=?,new_customer_days=?,min_amount=?,categories_json=?,excluded_products_json=?,updated_at=? WHERE id=?").run(
      input.name,
      input.type,
      input.enabled ? 1 : 0,
      input.percent ?? null,
      input.badge ?? null,
      input.code ?? null,
      input.startDate ?? null,
      input.endDate ?? null,
      input.newCustomerDays ?? null,
      input.minAmount ?? null,
      input.categoriesJson ?? null,
      input.excludedProductsJson ?? null,
      now(),
      discountId,
    );
  } else {
    db.prepare("INSERT INTO discounts (id,name,type,enabled,percent,badge,code,start_date,end_date,new_customer_days,min_amount,categories_json,excluded_products_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
      discountId,
      input.name,
      input.type,
      input.enabled ? 1 : 0,
      input.percent ?? null,
      input.badge ?? null,
      input.code ?? null,
      input.startDate ?? null,
      input.endDate ?? null,
      input.newCustomerDays ?? null,
      input.minAmount ?? null,
      input.categoriesJson ?? null,
      input.excludedProductsJson ?? null,
      now(),
      now(),
    );
  }
}

export function deleteDiscount(discountId: string) {
  db.prepare("DELETE FROM discounts WHERE id = ?").run(discountId);
}

function orderNo() {
  return `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function transactionNo(prefix = "TXN") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function getPaymentSettings(): PaymentSettings {
  db.prepare("INSERT OR IGNORE INTO payment_settings (id,updated_at) VALUES (1,?)").run(now());
  return db
    .prepare("SELECT moncash_enabled AS moncashEnabled, moncash_number AS moncashNumber, natcash_enabled AS natcashEnabled, natcash_number AS natcashNumber, cash_on_delivery_enabled AS cashOnDeliveryEnabled FROM payment_settings WHERE id = 1")
    .get() as PaymentSettings;
}

export function savePaymentSettings(input: Partial<PaymentSettings>) {
  db.prepare(
    "UPDATE payment_settings SET moncash_enabled=?,moncash_number=?,natcash_enabled=?,natcash_number=?,cash_on_delivery_enabled=?,updated_at=? WHERE id=1",
  ).run(
    input.moncashEnabled ? 1 : 0,
    input.moncashNumber ?? "",
    input.natcashEnabled ? 1 : 0,
    input.natcashNumber ?? "",
    input.cashOnDeliveryEnabled ? 1 : 0,
    now(),
  );
  return getPaymentSettings();
}

export function createOrderWithTransaction(input: {
  userId?: string | null;
  type?: "order" | "recharge";
  method: PaymentTransaction["method"];
  status: PaymentTransaction["status"];
  paymentStatus: string;
  orderStatus?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  orderTotal?: number;
  payerPhone?: string | null;
  proofUrl?: string | null;
  proofPublicId?: string | null;
  items?: unknown[];
  shippingAddress?: string;
}) {
  const txId = id();
  let orderId: string | null = null;
  const orderTotal = Number(input.orderTotal ?? input.amount);
  if ((input.type || "order") === "order") {
    orderId = id();
    db.prepare(`
      INSERT INTO orders (id,order_no,user_id,status,payment_status,fulfillment_status,payment_method,total,contact_name,contact_email,contact_phone,shipping_address,items_json,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      orderId,
      orderNo(),
      input.userId ?? null,
      input.orderStatus || "Nouvelle commande",
      input.paymentStatus,
      input.paymentStatus === "Paid" ? "En cours" : "Nouvelle commande",
      input.method,
      orderTotal,
      input.customerName,
      input.customerEmail,
      input.customerPhone,
      input.shippingAddress || "",
      JSON.stringify(input.items || []),
      now(),
      now(),
    );
  }

  db.prepare(`
    INSERT INTO payment_transactions (id,transaction_no,user_id,order_id,type,method,status,customer_name,customer_email,customer_phone,amount,payer_phone,proof_url,proof_public_id,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    txId,
    transactionNo(input.type === "recharge" ? "TOPUP" : "PAY"),
    input.userId ?? null,
    orderId,
    input.type || "order",
    input.method,
    input.status,
    input.customerName,
    input.customerEmail,
    input.customerPhone,
    input.amount,
    input.payerPhone ?? null,
    input.proofUrl ?? null,
    input.proofPublicId ?? null,
    now(),
    now(),
  );

  return { orderId, transactionId: txId };
}

export function getPaymentTransactions() {
  return (db
    .prepare(`
      SELECT id,transaction_no AS transactionNo,user_id AS userId,order_id AS orderId,type,method,status,customer_name AS customerName,
      customer_email AS customerEmail,customer_phone AS customerPhone,amount,payer_phone AS payerPhone,proof_url AS proofUrl,
      proof_public_id AS proofPublicId,admin_note AS adminNote,created_at AS createdAt
      FROM payment_transactions ORDER BY created_at DESC
    `)
    .all() as PaymentTransaction[]).map((item) => ({ ...item }));
}

export function getPaymentTransactionsForUser(userId: string) {
  return (db
    .prepare(`
      SELECT id,transaction_no AS transactionNo,user_id AS userId,order_id AS orderId,type,method,status,customer_name AS customerName,
      customer_email AS customerEmail,customer_phone AS customerPhone,amount,payer_phone AS payerPhone,proof_url AS proofUrl,
      proof_public_id AS proofPublicId,admin_note AS adminNote,created_at AS createdAt
      FROM payment_transactions WHERE user_id = ? ORDER BY created_at DESC
    `)
    .all(userId) as PaymentTransaction[]).map((item) => ({ ...item }));
}

function ticketNo() {
  return `TCK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function createSupportTicket(input: { userId?: string | null; name: string; email: string; subject: string; message: string }) {
  const ticketId = id();
  db.prepare("INSERT INTO support_tickets (id,ticket_no,user_id,name,email,subject,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").run(
    ticketId,
    ticketNo(),
    input.userId ?? null,
    input.name,
    input.email,
    input.subject,
    input.message,
    "open",
    now(),
    now(),
  );
  return getSupportTicketById(ticketId);
}

export function getSupportTicketById(ticketId: string) {
  return db
    .prepare("SELECT id,ticket_no AS ticketNo,user_id AS userId,name,email,subject,message,status,created_at AS createdAt FROM support_tickets WHERE id=?")
    .get(ticketId) as SupportTicket | undefined;
}

export function getSupportTicketsForUser(userId: string) {
  return (db
    .prepare("SELECT id,ticket_no AS ticketNo,user_id AS userId,name,email,subject,message,status,created_at AS createdAt FROM support_tickets WHERE user_id=? ORDER BY created_at DESC")
    .all(userId) as SupportTicket[]).map((ticket) => ({ ...ticket }));
}

export function getSupportTickets() {
  return (db
    .prepare("SELECT id,ticket_no AS ticketNo,user_id AS userId,name,email,subject,message,status,created_at AS createdAt FROM support_tickets ORDER BY created_at DESC")
    .all() as SupportTicket[]).map((ticket) => ({ ...ticket }));
}

function rowToSeller(row: Record<string, unknown>): DbSeller {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId),
    storeName: String(row.store_name ?? row.storeName),
    slug: String(row.slug),
    contactName: String(row.contact_name ?? row.contactName),
    email: String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    logoUrl: row.logo_url == null ? null : String(row.logo_url),
    coverUrl: row.cover_url == null ? null : String(row.cover_url),
    description: row.description == null ? null : String(row.description),
    returnPolicy: row.return_policy == null ? null : String(row.return_policy),
    shippingDelay: row.shipping_delay == null ? null : String(row.shipping_delay),
    commissionRate: Number(row.commission_rate ?? 10),
    rating: Number(row.rating ?? 0),
    status: String(row.status || "active") as DbSeller["status"],
    createdAt: String(row.created_at ?? row.createdAt),
  };
}

export function getSellers() {
  return (db.prepare("SELECT * FROM sellers ORDER BY created_at DESC").all() as Record<string, unknown>[]).map(rowToSeller);
}

export function getSellerById(sellerId: string) {
  const row = db.prepare("SELECT * FROM sellers WHERE id = ?").get(sellerId) as Record<string, unknown> | undefined;
  return row ? rowToSeller(row) : null;
}

export function getSellerByUserId(userId: string) {
  const row = db.prepare("SELECT * FROM sellers WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined;
  return row ? rowToSeller(row) : null;
}

export async function saveSeller(input: {
  id?: string;
  storeName: string;
  contactName: string;
  email: string;
  password?: string;
  phone?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  returnPolicy?: string | null;
  shippingDelay?: string | null;
  commissionRate?: number | null;
  status?: DbSeller["status"];
}) {
  const current = input.id ? getSellerById(input.id) : null;
  const userId = current?.userId || id();
  const sellerId = current?.id || id();
  const timestamp = now();
  const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : null;
  if (current) {
    db.prepare("UPDATE users SET email=?,name=?,phone=?,role='seller',updated_at=? WHERE id=?").run(input.email, input.contactName, input.phone ?? null, timestamp, userId);
    if (passwordHash) db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(passwordHash, userId);
    db.prepare(`
      UPDATE sellers SET store_name=?,slug=?,contact_name=?,email=?,phone=?,logo_url=?,cover_url=?,description=?,
      return_policy=?,shipping_delay=?,commission_rate=?,status=?,updated_at=? WHERE id=?
    `).run(
      input.storeName,
      current.slug,
      input.contactName,
      input.email,
      input.phone ?? null,
      input.logoUrl ?? null,
      input.coverUrl ?? null,
      input.description ?? null,
      input.returnPolicy ?? null,
      input.shippingDelay ?? null,
      input.commissionRate ?? 10,
      input.status || "active",
      timestamp,
      sellerId,
    );
  } else {
    db.prepare("INSERT INTO users (id,email,password_hash,name,role,phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").run(
      userId,
      input.email,
      passwordHash || await bcrypt.hash("Seller123456!", 10),
      input.contactName,
      "seller",
      input.phone ?? null,
      timestamp,
      timestamp,
    );
    db.prepare(`
      INSERT INTO sellers (id,user_id,store_name,slug,contact_name,email,phone,logo_url,cover_url,description,return_policy,shipping_delay,commission_rate,rating,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      sellerId,
      userId,
      input.storeName,
      `${slugify(input.storeName)}-${sellerId.slice(0, 5)}`,
      input.contactName,
      input.email,
      input.phone ?? null,
      input.logoUrl ?? null,
      input.coverUrl ?? null,
      input.description ?? null,
      input.returnPolicy ?? null,
      input.shippingDelay ?? null,
      input.commissionRate ?? 10,
      0,
      input.status || "active",
      timestamp,
      timestamp,
    );
  }
  return getSellerById(sellerId);
}

export function deleteSeller(sellerId: string) {
  const seller = getSellerById(sellerId);
  if (!seller) return;
  db.prepare("UPDATE products SET seller_id=NULL WHERE seller_id=?").run(sellerId);
  db.prepare("DELETE FROM sellers WHERE id=?").run(sellerId);
  db.prepare("DELETE FROM users WHERE id=? AND role='seller'").run(seller.userId);
}

export function updateSellerStatus(sellerId: string, status: DbSeller["status"]) {
  if (!["pending", "active", "suspended", "rejected"].includes(status)) return null;
  db.prepare("UPDATE sellers SET status=?,updated_at=? WHERE id=?").run(status, now(), sellerId);
  const seller = getSellerById(sellerId);
  if (seller) db.prepare("UPDATE users SET account_status=?,updated_at=? WHERE id=?").run(status === "active" ? "active" : "suspended", now(), seller.userId);
  return seller;
}

export function updateSellerProfile(sellerId: string, input: {
  storeName?: string;
  contactName?: string;
  phone?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  returnPolicy?: string | null;
  shippingDelay?: string | null;
}) {
  const current = getSellerById(sellerId);
  if (!current) return null;
  const next = {
    storeName: input.storeName ?? current.storeName,
    contactName: input.contactName ?? current.contactName,
    phone: input.phone ?? current.phone,
    logoUrl: input.logoUrl ?? current.logoUrl,
    coverUrl: input.coverUrl ?? current.coverUrl,
    description: input.description ?? current.description,
    returnPolicy: input.returnPolicy ?? current.returnPolicy,
    shippingDelay: input.shippingDelay ?? current.shippingDelay,
  };
  db.prepare(`
    UPDATE sellers SET store_name=?,contact_name=?,phone=?,logo_url=?,cover_url=?,description=?,return_policy=?,shipping_delay=?,updated_at=? WHERE id=?
  `).run(next.storeName, next.contactName, next.phone, next.logoUrl, next.coverUrl, next.description, next.returnPolicy, next.shippingDelay, now(), sellerId);
  db.prepare("UPDATE users SET name=?,phone=?,updated_at=? WHERE id=?").run(next.contactName, next.phone, now(), current.userId);
  return getSellerById(sellerId);
}

export function getSellerStats(sellerId: string) {
  const productRow = db.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(stock),0) AS stock FROM products WHERE seller_id=?").get(sellerId) as { count: number; stock: number };
  const seller = getSellerById(sellerId);
  const orders = getAdminOrders().filter((order) => order.items.some((item) => item.seller === seller?.storeName));
  const revenue = orders.reduce((sum, order) => sum + order.items.filter((item) => item.seller === seller?.storeName).reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);
  return { products: Number(productRow.count || 0), stock: Number(productRow.stock || 0), orders: orders.length, revenue };
}

export function getOrdersForSeller(sellerId: string) {
  const seller = getSellerById(sellerId);
  if (!seller) return [];
  return getAdminOrders().filter((order) => order.items.some((item) => item.seller === seller.storeName));
}

export function getTicketsForSeller(sellerId: string) {
  const seller = getSellerById(sellerId);
  if (!seller) return [];
  return getSupportTickets().filter((ticket) => ticket.subject.toLowerCase().includes(seller.storeName.toLowerCase()) || ticket.message.toLowerCase().includes(seller.storeName.toLowerCase()));
}

export function getCustomers() {
  return (db
    .prepare("SELECT id,email,name,role,phone,profile_photo AS profilePhoto,gender,first_name AS firstName,last_name AS lastName,birth_date AS birthDate,cover_photo AS coverPhoto,account_status AS accountStatus,notifications,settings,balance FROM users WHERE role='customer' ORDER BY name")
    .all() as DbUser[]).map((user) => ({ ...user }));
}

export function getCustomerAdminProfile(userId: string) {
  const user = getUserById(userId);
  if (!user || user.role !== "customer") return null;
  return {
    user,
    addresses: getAddressesForUser(userId),
    orders: getAllOrdersForUser(userId),
    transactions: getPaymentTransactionsForUser(userId),
    tickets: getSupportTicketsForUser(userId),
  };
}

export function updateCustomerStatus(userId: string, status: "active" | "suspended" | "banned") {
  db.prepare("UPDATE users SET account_status=?, updated_at=? WHERE id=? AND role='customer'").run(status, now(), userId);
  return getUserById(userId);
}

export function updatePaymentTransaction(input: { id: string; status: "paid" | "rejected"; adminNote?: string | null }) {
  const tx = db.prepare("SELECT * FROM payment_transactions WHERE id = ?").get(input.id) as
    | { id: string; user_id: string | null; order_id: string | null; type: "order" | "recharge"; amount: number }
    | undefined;
  if (!tx) return null;

  db.prepare("UPDATE payment_transactions SET status=?,admin_note=?,updated_at=? WHERE id=?").run(input.status, input.adminNote ?? null, now(), input.id);

  if (tx.order_id) {
    const nextOrderStatus = input.status === "paid" ? "En cours" : "Annulée";
    const order = db.prepare("SELECT total FROM orders WHERE id=?").get(tx.order_id) as { total: number } | undefined;
    const overpayment = input.status === "paid" && tx.user_id && order ? Math.max(0, Number(tx.amount) - Number(order.total)) : 0;
    db.prepare("UPDATE orders SET payment_status=?,status=?,fulfillment_status=?,updated_at=? WHERE id=?").run(
      input.status === "paid" ? "Paid" : "Rejected",
      nextOrderStatus,
      nextOrderStatus,
      now(),
      tx.order_id,
    );
    if (overpayment > 0) {
      db.prepare("UPDATE users SET balance = balance + ?, updated_at=? WHERE id=?").run(overpayment, now(), tx.user_id);
    }
    db.prepare("INSERT INTO order_status_history (id,order_id,status,note,created_at) VALUES (?,?,?,?,?)").run(
      id(),
      tx.order_id,
      nextOrderStatus,
      [
        input.adminNote ||
          (input.status === "paid" ? "Paiement confirmé par admin." : "Paiement refusé par admin."),
        overpayment > 0 ? `Surplus crédité au solde: ${overpayment.toFixed(2)}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      now(),
    );
  }

  if (input.status === "paid" && tx.type === "recharge" && tx.user_id) {
    db.prepare("UPDATE users SET balance = balance + ?, updated_at=? WHERE id=?").run(tx.amount, now(), tx.user_id);
  }

  return getPaymentTransactions().find((item) => item.id === input.id) || null;
}

export function debitUserBalance(userId: string, amount: number) {
  const user = getUserById(userId);
  if (!user || user.balance < amount) return false;
  db.prepare("UPDATE users SET balance = balance - ?, updated_at=? WHERE id=?").run(amount, now(), userId);
  return true;
}
