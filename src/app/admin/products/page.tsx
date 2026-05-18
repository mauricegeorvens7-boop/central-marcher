import { AdminShell } from "@/components/admin/AdminShell";
import { ProductManager } from "@/components/admin/ProductManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getCategories, getProducts } from "@/lib/db";

export const metadata = { title: "Admin products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  return (
    <AdminShell title="Gestion produits">
      <ProductManager products={getProducts({ includeHidden: true })} categories={getCategories()} />
    </AdminShell>
  );
}
