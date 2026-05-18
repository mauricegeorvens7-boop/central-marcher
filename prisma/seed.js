const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

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

const slugify = (value) =>
  value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const products = [
  {
    name: "Aurora X1 14-inch OLED Ultrabook",
    sku: "AUR-X1-512",
    price: 1499.99,
    promoPrice: 1199.99,
    category: "Computers & Tablets",
    brand: "Northstar",
    stock: 42,
    status: "active",
    shortDescription: "Premium OLED ultrabook with all-day battery.",
    description: "A thin premium notebook for work, media, and travel with all-day battery life.",
    color: "Graphite",
    model: "X1",
    images: [img("photo-1496181133206-80ce9b88a853"), img("photo-1517336714731-489689fd1ca8")],
  },
  {
    name: "Vista 65-inch QLED 4K Smart TV",
    sku: "VIS-65Q-2026",
    price: 1199.99,
    promoPrice: 899.99,
    category: "TV & Home Theater",
    brand: "Lumio",
    stock: 18,
    status: "active",
    shortDescription: "Bright 4K QLED TV with 120Hz motion.",
    description: "Bright, fluid entertainment for movies, sport, and next-gen consoles.",
    color: "Black",
    model: "65Q",
    images: [img("photo-1593784991095-a205069470b6"), img("photo-1601944179066-29786cb9d32a")],
  },
  {
    name: "PulseBuds Pro Noise Cancelling Earbuds",
    sku: "PBP-WHT-02",
    price: 219.99,
    promoPrice: 149.99,
    category: "Audio",
    brand: "Sonicwell",
    stock: 67,
    status: "active",
    shortDescription: "Open-box earbuds with adaptive noise cancelling.",
    description: "Compact earbuds with clean calls, strong noise control, and reduced open-box pricing.",
    condition: "Open Box Excellent",
    color: "White",
    images: [img("photo-1606220945770-b5b6c2c55bf1"), img("photo-1590658268037-6bf12165a8df")],
  },
  {
    name: "ForgeBox Series G Console 1TB",
    sku: "FBG-1TB",
    price: 499.99,
    category: "Gaming",
    brand: "Forge",
    stock: 12,
    status: "active",
    shortDescription: "4K gaming console with 1TB SSD.",
    description: "A powerful console for fast load times, cinematic titles, and multiplayer nights.",
    color: "Carbon",
    model: "Series G",
    images: [img("photo-1606813907291-d86efa9b94db")],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Admin123456!", 12);

  await prisma.user.upsert({
    where: { email: "admin@store.com" },
    update: { passwordHash, role: "admin", name: "Store Admin" },
    create: {
      email: "admin@store.com",
      passwordHash,
      name: "Store Admin",
      role: "admin",
    },
  });

  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: slugify(product.category) } });
    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: slugify(product.name),
        price: product.price,
        promoPrice: product.promoPrice || null,
        categoryId: category.id,
        brand: product.brand,
        stock: product.stock,
        status: product.status,
        shortDescription: product.shortDescription,
        description: product.description,
        condition: product.condition || "New",
        color: product.color || null,
        model: product.model || null,
      },
      create: {
        name: product.name,
        slug: slugify(product.name),
        sku: product.sku,
        price: product.price,
        promoPrice: product.promoPrice || null,
        categoryId: category.id,
        brand: product.brand,
        stock: product.stock,
        status: product.status,
        shortDescription: product.shortDescription,
        description: product.description,
        condition: product.condition || "New",
        color: product.color || null,
        model: product.model || null,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    await prisma.productImage.createMany({
      data: product.images.map((url, index) => ({
        productId: saved.id,
        url,
        alt: product.name,
        sortOrder: index,
      })),
    });
  }

  await prisma.banner.upsert({
    where: { id: "homepage-main-banner" },
    update: {},
    create: {
      id: "homepage-main-banner",
      title: "Fresh tech, sharper prices",
      subtitle: "Manage this homepage hero from the admin dashboard.",
      imageUrl: img("photo-1519389950473-47ba0277781c"),
      ctaText: "Shop deals",
      ctaLink: "/deals",
      position: "homepage_hero",
      active: true,
    },
  });

  await prisma.announcement.upsert({
    where: { id: "top-announcement" },
    update: {},
    create: {
      id: "top-announcement",
      text: "Free shipping on eligible orders over $250",
      link: "/delivery-pickup",
      type: "top_bar",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2027-01-01"),
      active: true,
    },
  });

  await prisma.order.upsert({
    where: { orderNo: "ORD-10482" },
    update: {},
    create: {
      orderNo: "ORD-10482",
      status: "paid",
      total: 1349.98,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
