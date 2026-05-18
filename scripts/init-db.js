const { mkdirSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { DatabaseSync } = require("node:sqlite");

const dbPath = join(process.cwd(), "data", "store.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

const now = () => new Date().toISOString();
const id = () => randomUUID();
const slugify = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const img = (imageId) => `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','customer')) DEFAULT 'customer',phone TEXT,profile_photo TEXT,notifications TEXT NOT NULL DEFAULT '{"email":true,"sms":false,"deals":true}',settings TEXT NOT NULL DEFAULT '{"language":"fr","currency":"CAD","theme":"light"}',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS user_addresses (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,label TEXT NOT NULL,name TEXT NOT NULL,line1 TEXT NOT NULL,city TEXT NOT NULL,province TEXT NOT NULL,postal_code TEXT NOT NULL,phone TEXT,is_default INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,slug TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,sku TEXT NOT NULL UNIQUE,price REAL NOT NULL,promo_price REAL,short_description TEXT NOT NULL,description TEXT NOT NULL,benefits_and_usage TEXT,seo_title TEXT,seo_description TEXT,keywords TEXT,variants_json TEXT,shipping_json TEXT,protection_json TEXT,marketplace_json TEXT,specs_json TEXT,discount_json TEXT,category_id TEXT NOT NULL,stock INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL CHECK(status IN ('active','draft','hidden')) DEFAULT 'draft',brand TEXT NOT NULL DEFAULT 'Central Market',condition TEXT NOT NULL DEFAULT 'New',color TEXT,size TEXT,model TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(category_id) REFERENCES categories(id));
  CREATE TABLE IF NOT EXISTS product_images (id TEXT PRIMARY KEY,product_id TEXT NOT NULL,url TEXT NOT NULL,public_id TEXT,alt TEXT,sort_order INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS banners (id TEXT PRIMARY KEY,title TEXT NOT NULL,subtitle TEXT NOT NULL,image_url TEXT NOT NULL,public_id TEXT,cta_text TEXT NOT NULL,cta_link TEXT NOT NULL,position TEXT NOT NULL CHECK(position IN ('homepage_hero','category_banner','promo_banner')),active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY,text TEXT NOT NULL,link TEXT,image_url TEXT,public_id TEXT,type TEXT NOT NULL CHECK(type IN ('top_bar','popup','product_promo','homepage_section')),start_date TEXT NOT NULL,end_date TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY,order_no TEXT NOT NULL UNIQUE,user_id TEXT,status TEXT NOT NULL DEFAULT 'pending',total REAL NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY,order_id TEXT NOT NULL,product_id TEXT NOT NULL,quantity INTEGER NOT NULL,price REAL NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id));
  CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,product_id TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(user_id, product_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS recently_viewed (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,product_id TEXT NOT NULL,viewed_at TEXT NOT NULL,UNIQUE(user_id, product_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS discounts (id TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,percent REAL,badge TEXT,code TEXT,start_date TEXT,end_date TEXT,new_customer_days INTEGER,min_amount REAL,categories_json TEXT,excluded_products_json TEXT,usage_count INTEGER NOT NULL DEFAULT 0,revenue_generated REAL NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
`);

function columns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name);
}

function ensureColumn(table, column, definition) {
  if (!columns(table).includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn("users", "phone", "TEXT");
ensureColumn("users", "profile_photo", "TEXT");
ensureColumn("users", "notifications", "TEXT NOT NULL DEFAULT '{\"email\":true,\"sms\":false,\"deals\":true}'");
ensureColumn("users", "settings", "TEXT NOT NULL DEFAULT '{\"language\":\"fr\",\"currency\":\"CAD\",\"theme\":\"light\"}'");
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

async function main() {
  const users = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (users === 0) {
    db.prepare("INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(id(), "admin@store.com", await bcrypt.hash("Admin123456!", 12), "Store Admin", "admin", "+1 555 0100", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80", now(), now());
    const customerId = id();
    db.prepare("INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(customerId, "client@store.com", await bcrypt.hash("Client123456!", 12), "Maya Client", "customer", "+1 555 0111", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80", now(), now());
    db.prepare("INSERT INTO user_addresses (id,user_id,label,name,line1,city,province,postal_code,phone,is_default,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id(), customerId, "Maison", "Maya Client", "123 Rue Centrale", "Montreal", "QC", "H2X 1Y4", "+1 555 0111", 1, now());
  }

  if (!db.prepare("SELECT id FROM users WHERE role='customer' LIMIT 1").get()) {
    const customerId = id();
    db.prepare("INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(customerId, "client@store.com", await bcrypt.hash("Client123456!", 12), "Maya Client", "customer", "+1 555 0111", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80", now(), now());
    db.prepare("INSERT INTO user_addresses (id,user_id,label,name,line1,city,province,postal_code,phone,is_default,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id(), customerId, "Maison", "Maya Client", "123 Rue Centrale", "Montreal", "QC", "H2X 1Y4", "+1 555 0111", 1, now());
  }

  const categoryNames = ["Electronics", "Computers & Tablets", "Cell Phones", "TV & Home Theater", "Appliances", "Gaming", "Audio", "Cameras", "Smart Home", "Beauty & Health", "Furniture", "Open Box", "Deals"];
  for (const name of categoryNames) {
    db.prepare("INSERT OR IGNORE INTO categories (id,name,slug,created_at,updated_at) VALUES (?,?,?,?,?)").run(id(), name, slugify(name), now(), now());
  }

  if (db.prepare("SELECT COUNT(*) AS count FROM products").get().count === 0) {
    const samples = [
      ["Aurora X1 14-inch OLED Ultrabook", "AUR-X1-512", 1499.99, 1199.99, "Computers & Tablets", "Northstar", 42, img("photo-1496181133206-80ce9b88a853")],
      ["Vista 65-inch QLED 4K Smart TV", "VIS-65Q-2026", 1199.99, 899.99, "TV & Home Theater", "Lumio", 18, img("photo-1593784991095-a205069470b6")],
      ["PulseBuds Pro Noise Cancelling Earbuds", "PBP-WHT-02", 219.99, 149.99, "Audio", "Sonicwell", 67, img("photo-1606220945770-b5b6c2c55bf1")],
      ["ForgeBox Series G Console 1TB", "FBG-1TB", 499.99, null, "Gaming", "Forge", 12, img("photo-1606813907291-d86efa9b94db")],
    ];
    for (const sample of samples) {
      const category = db.prepare("SELECT id FROM categories WHERE slug = ?").get(slugify(sample[4]));
      const productId = id();
      db.prepare("INSERT INTO products (id,name,slug,sku,price,promo_price,short_description,description,category_id,stock,status,brand,condition,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(productId, sample[0], `${slugify(sample[0])}-${productId.slice(0, 6)}`, sample[1], sample[2], sample[3], "Admin-editable product saved in SQLite.", "Full product description managed from the admin dashboard.", category.id, sample[6], "active", sample[5], sample[0].includes("PulseBuds") ? "Open Box Excellent" : "New", now(), now());
      db.prepare("INSERT INTO product_images (id,product_id,url,alt,sort_order,created_at) VALUES (?,?,?,?,?,?)").run(id(), productId, sample[7], sample[0], 0, now());
    }
  }

  if (db.prepare("SELECT COUNT(*) AS count FROM banners").get().count === 0) {
    db.prepare("INSERT INTO banners (id,title,subtitle,image_url,cta_text,cta_link,position,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").run(id(), "Fresh tech, sharper prices", "Manage this homepage hero from the admin dashboard.", img("photo-1519389950473-47ba0277781c"), "Shop deals", "/deals", "homepage_hero", 1, now(), now());
  }

  if (db.prepare("SELECT COUNT(*) AS count FROM announcements").get().count === 0) {
    db.prepare("INSERT INTO announcements (id,text,link,type,start_date,end_date,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(id(), "Free shipping on eligible orders over $250", "/delivery-pickup", "top_bar", "2026-01-01", "2027-01-01", 1, now(), now());
  }

  if (db.prepare("SELECT COUNT(*) AS count FROM orders").get().count === 0) {
    const customer = db.prepare("SELECT id FROM users WHERE role='customer' LIMIT 1").get();
    db.prepare("INSERT INTO orders (id,order_no,user_id,status,total,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run(id(), "ORD-10482", customer?.id || null, "paid", 1349.98, now(), now());
  }

  const customer = db.prepare("SELECT id FROM users WHERE role='customer' LIMIT 1").get();
  const firstProduct = db.prepare("SELECT id FROM products LIMIT 1").get();
  if (customer && firstProduct && db.prepare("SELECT COUNT(*) AS count FROM favorites").get().count === 0) {
    db.prepare("INSERT OR IGNORE INTO favorites (id,user_id,product_id,created_at) VALUES (?,?,?,?)").run(id(), customer.id, firstProduct.id, now());
  }

  console.log("SQLite database ready at data/store.db");
}

main();
