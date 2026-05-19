import { AdminShell } from "@/components/admin/AdminShell";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import { requireAdmin } from "@/lib/admin/auth";
import { getAnnouncements } from "@/lib/db";

export const metadata = { title: "Admin announcements" };

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const announcements = await getAnnouncements(true);
  return (
    <AdminShell title="Gestion annonces">
      <AnnouncementManager announcements={announcements} />
    </AdminShell>
  );
}
