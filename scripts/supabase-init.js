const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    process.env[match[1]] = value;
  }
}

const slugify = (value) =>
  value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const img = (imageId) => `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`;
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

loadEnv();

if (!process.env.DATABASE_URL || !/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
  console.error("DATABASE_URL must be a Supabase/Postgres URL.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function main() {
  await pool.query(`
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
      gender TEXT,
      first_name TEXT,
      last_name TEXT,
      birth_date TEXT,
      cover_photo TEXT,
      account_status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT,
      balance DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sellers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
      commission_rate DOUBLE PRECISION NOT NULL DEFAULT 10,
      rating DOUBLE PRECISION NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending','active','suspended','rejected')) DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      name TEXT NOT NULL,
      line1 TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      phone TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
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
      price DOUBLE PRECISION NOT NULL,
      promo_price DOUBLE PRECISION,
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
      category_id TEXT NOT NULL REFERENCES categories(id),
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('active','draft','hidden')) DEFAULT 'draft',
      brand TEXT NOT NULL DEFAULT 'Central Market',
      condition TEXT NOT NULL DEFAULT 'New',
      seller_id TEXT REFERENCES sellers(id),
      color TEXT,
      size TEXT,
      model TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      public_id TEXT,
      media_type TEXT NOT NULL DEFAULT 'image',
      alt TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      image_url TEXT NOT NULL,
      public_id TEXT,
      product_image_url TEXT,
      product_public_id TEXT,
      product_images_json TEXT,
      cta_text TEXT NOT NULL,
      cta_link TEXT NOT NULL,
      position TEXT NOT NULL CHECK(position IN ('homepage_hero','category_banner','promo_banner')),
      background_color TEXT NOT NULL DEFAULT '#0f5132',
      gradient TEXT,
      image_position TEXT NOT NULL DEFAULT 'right',
      text_position TEXT NOT NULL DEFAULT 'left',
      size TEXT NOT NULL DEFAULT 'large',
      title_size TEXT NOT NULL DEFAULT 'large',
      text_color TEXT NOT NULL DEFAULT '#ffffff',
      subtitle_color TEXT NOT NULL DEFAULT '#ffffff',
      font_family TEXT NOT NULL DEFAULT 'sans',
      text_badge_enabled INTEGER NOT NULL DEFAULT 0,
      text_badge_color TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.92)',
      text_badge_text_color TEXT NOT NULL DEFAULT '#0f172a',
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
      user_id TEXT REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      fulfillment_status TEXT NOT NULL DEFAULT 'Processing',
      payment_method TEXT,
      total DOUBLE PRECISION NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      shipping_address TEXT,
      items_json TEXT,
      tracking_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS recently_viewed (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      viewed_at TEXT NOT NULL,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      percent DOUBLE PRECISION,
      badge TEXT,
      code TEXT,
      start_date TEXT,
      end_date TEXT,
      new_customer_days INTEGER,
      min_amount DOUBLE PRECISION,
      categories_json TEXT,
      excluded_products_json TEXT,
      usage_count INTEGER NOT NULL DEFAULT 0,
      revenue_generated DOUBLE PRECISION NOT NULL DEFAULT 0,
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
      user_id TEXT REFERENCES users(id),
      order_id TEXT REFERENCES orders(id),
      type TEXT NOT NULL CHECK(type IN ('order','recharge')),
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      payer_phone TEXT,
      proof_url TEXT,
      proof_public_id TEXT,
      admin_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_no TEXT NOT NULL UNIQUE,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await pool.query("INSERT INTO payment_settings (id, updated_at) VALUES (1, $1) ON CONFLICT (id) DO NOTHING", [now()]);
  await pool.query(`
    ALTER TABLE banners
      ADD COLUMN IF NOT EXISTS title_size TEXT NOT NULL DEFAULT 'large',
      ADD COLUMN IF NOT EXISTS text_color TEXT NOT NULL DEFAULT '#ffffff',
      ADD COLUMN IF NOT EXISTS subtitle_color TEXT NOT NULL DEFAULT '#ffffff',
      ADD COLUMN IF NOT EXISTS font_family TEXT NOT NULL DEFAULT 'sans',
      ADD COLUMN IF NOT EXISTS text_badge_enabled INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS text_badge_color TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.92)',
      ADD COLUMN IF NOT EXISTS text_badge_text_color TEXT NOT NULL DEFAULT '#0f172a'
  `);

  const adminPassword = await bcrypt.hash("Admin123456!", 12);
  await pool.query(
    `INSERT INTO users (id,email,password_hash,name,role,phone,profile_photo,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='admin', updated_at=EXCLUDED.updated_at`,
    [
      id(),
      "admin@store.com",
      adminPassword,
      "Store Admin",
      "admin",
      "+1 555 0100",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      now(),
      now(),
    ],
  );

  const categories = [
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

  for (const name of categories) {
    await pool.query(
      "INSERT INTO categories (id,name,slug,created_at,updated_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING",
      [id(), name, slugify(name), now(), now()],
    );
  }

  const productCount = await pool.query("SELECT COUNT(*) AS count FROM products");
  if (Number(productCount.rows[0].count) === 0) {
    const samples = [
      ["Aurora X1 14-inch OLED Ultrabook", "AUR-X1-512", 1499.99, 1199.99, "Computers & Tablets", "Northstar", 42, img("photo-1496181133206-80ce9b88a853")],
      ["Vista 65-inch QLED 4K Smart TV", "VIS-65Q-2026", 1199.99, 899.99, "TV & Home Theater", "Lumio", 18, img("photo-1593784991095-a205069470b6")],
      ["PulseBuds Pro Noise Cancelling Earbuds", "PBP-WHT-02", 219.99, 149.99, "Audio", "Sonicwell", 67, img("photo-1606220945770-b5b6c2c55bf1")],
      ["ForgeBox Series G Console 1TB", "FBG-1TB", 499.99, null, "Gaming", "Forge", 12, img("photo-1606813907291-d86efa9b94db")],
    ];
    for (const sample of samples) {
      const category = await pool.query("SELECT id FROM categories WHERE slug=$1", [slugify(sample[4])]);
      const productId = id();
      await pool.query(
        `INSERT INTO products (id,name,slug,sku,price,promo_price,short_description,description,category_id,stock,status,brand,condition,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11,$12,$13,$14)`,
        [
          productId,
          sample[0],
          slugify(sample[0]),
          sample[1],
          sample[2],
          sample[3],
          "Admin-editable product saved in Supabase.",
          "Full product description managed from the admin dashboard.",
          category.rows[0].id,
          sample[6],
          sample[5],
          sample[0].includes("PulseBuds") ? "Open Box Excellent" : "New",
          now(),
          now(),
        ],
      );
      await pool.query("INSERT INTO product_images (id,product_id,url,alt,sort_order,created_at) VALUES ($1,$2,$3,$4,$5,$6)", [
        id(),
        productId,
        sample[7],
        sample[0],
        0,
        now(),
      ]);
    }
  }

  console.log("Supabase database is ready. Default admin: admin@store.com / Admin123456!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
