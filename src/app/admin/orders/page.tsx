import { AdminShell } from "@/components/admin/AdminShell";
import { OrderManager } from "@/components/admin/OrderManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminOrders } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = getAdminOrders();

  return (
    <AdminShell title="Gestion commandes">
      <OrderManager orders={orders} />
    </AdminShell>
  );
}
