import { AdminShell } from "@/components/admin/AdminShell";
import { SellerManager } from "@/components/admin/SellerManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getSellers } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sellers" };

export default async function AdminSellersPage() {
  await requireAdmin();
  return (
    <AdminShell title="Gestion vendeurs">
      <SellerManager sellers={getSellers()} />
    </AdminShell>
  );
}
