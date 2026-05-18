import Link from "next/link";
import { ReactNode } from "react";
import { BadgePercent, BarChart3, CreditCard, ImageIcon, Inbox, Megaphone, Package, PlusCircle, ShoppingBag, Store, Users } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { AdminSoundNotifier } from "@/components/SoundNotifications";

const links = [
  [BarChart3, "Dashboard", "/admin"],
  [Inbox, "Messages", "/admin/messages"],
  [ShoppingBag, "Orders", "/admin/orders"],
  [Users, "Customers", "/admin/customers"],
  [Store, "Sellers", "/admin/sellers"],
  [Package, "Products", "/admin/products"],
  [BadgePercent, "Discounts", "/admin/discounts"],
  [CreditCard, "Payments", "/admin/payments"],
  [ImageIcon, "Banners", "/admin/banners"],
  [Megaphone, "Announcements", "/admin/announcements"],
];

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-100">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white lg:sticky lg:top-28 lg:h-fit">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Admin</p>
            <h2 className="text-xl font-black">Store Control</h2>
          </div>
          <nav className="grid gap-2">
            {links.map(([Icon, label, href]) => (
              <Link key={String(label)} href={String(href)} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
                <Icon size={18} />
                {String(label)}
              </Link>
            ))}
          </nav>
          <Link href="/admin/products" className="mt-5 flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-black text-slate-950">
            <PlusCircle size={18} /> Add Product
          </Link>
          <LogoutButton />
        </aside>
        <section>
          <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Secured admin area</p>
              <h1 className="text-3xl font-black">{title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminSoundNotifier />
              <Link className="btn-secondary" href="/admin/products">Add Product</Link>
              <Link className="btn-secondary" href="/admin/banners">Manage Banners</Link>
              <Link className="btn-secondary" href="/admin/announcements">Announcements</Link>
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
