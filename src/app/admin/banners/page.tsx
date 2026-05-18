import { AdminShell } from "@/components/admin/AdminShell";
import { BannerManager } from "@/components/admin/BannerManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getBanners } from "@/lib/db";

export const metadata = { title: "Admin banners" };

export default async function AdminBannersPage() {
  await requireAdmin();
  return (
    <AdminShell title="Gestion banners">
      <BannerManager banners={getBanners(true)} />
    </AdminShell>
  );
}
