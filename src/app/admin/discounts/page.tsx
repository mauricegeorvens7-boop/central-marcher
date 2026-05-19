import { AdminShell } from "@/components/admin/AdminShell";
import { DiscountManager } from "@/components/admin/DiscountManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getDiscounts } from "@/lib/db";

export const metadata = { title: "Admin discounts" };

export default async function AdminDiscountsPage() {
  await requireAdmin();
  const discounts = await getDiscounts(true);
  return (
    <AdminShell title="Gestion réductions">
      <DiscountManager discounts={discounts} />
    </AdminShell>
  );
}
