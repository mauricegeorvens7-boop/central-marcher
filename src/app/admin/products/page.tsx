import { AdminShell } from "@/components/admin/AdminShell";
import { ProductManager } from "@/components/admin/ProductManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getCategories, getProducts } from "@/lib/db";

export const metadata = { title: "Admin products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const [products, categories] = await Promise.all([getProducts({ includeHidden: true }), getCategories()]);
  return (
    <AdminShell title="Gestion produits">
      <ProductManager products={products} categories={categories} />
    </AdminShell>
  );
}
