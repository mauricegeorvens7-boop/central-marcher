# Central Market Commerce

Original e-commerce platform with a real secured admin dashboard, SQLite persistence, and Cloudinary upload support.

## Login

- URL: `http://localhost:3000/login`
- Admin: `admin@store.com` / `Admin123456!`
- Demo customer: `client@store.com` / `Client123456!`

There is one login page. The API checks the saved user role and redirects automatically:

- `admin` -> `/admin`
- `customer` -> `/account`

All `/admin` pages and admin APIs require a signed `store_session` cookie with role `admin`. Customers cannot access admin routes. The Cloudinary secret is only used server-side.

## Setup

```bash
npm install
npm run db:init
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env` from `.env.example`:

```bash
DATABASE_URL="file:./dev.db"
ADMIN_SESSION_SECRET="change-this-long-random-secret"
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

## Cloudinary

1. Create a free Cloudinary account.
2. Go to Dashboard and copy Cloud name, API Key, and API Secret.
3. Paste them into `.env`.
4. Restart `npm run dev`.
5. In `/admin/products` or `/admin/banners`, choose an image. The browser sends the file to `/api/upload`; the server validates type/size, uploads to Cloudinary, and stores the returned `secure_url` and `public_id` in SQLite.

Accepted image types: JPG, PNG, WEBP, GIF. Max size: 5MB.

## Admin Features

- `/admin`: stats, recent products, recent orders, quick actions
- `/admin/products`: list, add, edit, delete products, price, promo price, SKU, stock, status, category, descriptions, images, variants
- `/admin/products`: AI helper button to generate `fullDescription`, `benefitsAndUsage`, `seoTitle`, `seoDescription`, and `keywords`; admin must review and save manually
- `/admin/products`: dynamic JSON-controlled variants, shipping, protection, marketplace, specifications, and product discount rules
- `/admin/discounts`: create product, category, global, new-customer, limited-time, flash-sale, and manual promo-code discounts
- `/admin/banners`: add, edit, delete homepage/category/promo banners
- `/admin/announcements`: add, edit, delete top bar, popup, product promo, homepage section announcements

Products, banners, and announcements are saved in `data/store.db` and rendered automatically on the storefront.

## API Routes

- `POST /api/login`
- `POST /api/logout`
- `POST /api/register`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/[id]`
- `DELETE /api/admin/products/[id]`
- `POST /api/admin/ai-generate-product-content`
- `GET /api/admin/discounts`
- `POST /api/admin/discounts`
- `PUT /api/admin/discounts/[id]`
- `DELETE /api/admin/discounts/[id]`
- `GET /api/admin/banners`
- `POST /api/admin/banners`
- `PUT /api/admin/banners/[id]`
- `DELETE /api/admin/banners/[id]`
- `GET /api/admin/announcements`
- `POST /api/admin/announcements`
- `PUT /api/admin/announcements/[id]`
- `DELETE /api/admin/announcements/[id]`
- `POST /api/upload`
- `GET /api/products`
- `GET /api/search?q=laptop`

## Database Schema

Runtime SQLite tables:

- `users`: admin/customer role, hashed password
- `user_addresses`
- `favorites`
- `recently_viewed`
- `categories`
- `products`
- `product_images`
- `discounts`
- `banners`
- `announcements`
- `orders`
- `order_items`

The equivalent Prisma schema is included in `prisma/schema.prisma` for a future PostgreSQL/Supabase migration.

## Scripts

```bash
npm run db:init
npm run lint
npm run build
npm run dev
npm run start
```
