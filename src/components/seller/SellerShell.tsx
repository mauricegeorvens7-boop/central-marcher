import Link from "next/link";
import { ReactNode } from "react";
import { BadgePercent, BarChart3, Inbox, Package, Settings, ShoppingBag } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import type { DbSeller } from "@/lib/db";

const links = [
  [BarChart3, "Dashboard", "/seller"],
  [Package, "Produits", "/seller/products"],
  [ShoppingBag, "Ventes", "/seller/sales"],
  [BadgePercent, "Réductions", "/seller/discounts"],
  [Inbox, "Messages", "/seller/messages"],
  [Settings, "Profil", "/seller/profile"],
];

export function SellerShell({ children, seller, title }: { children: ReactNode; seller: DbSeller; title: string }) {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-100">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white lg:sticky lg:top-28 lg:h-fit">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Espace vendeur</p>
          <h2 className="mt-1 text-xl font-black">{seller.storeName}</h2>
          <p className="mt-1 text-xs text-slate-300">{seller.status} | Commission {seller.commissionRate}%</p>
          <nav className="mt-6 grid gap-2">
            {links.map(([Icon, label, href]) => (
              <Link key={String(label)} href={String(href)} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
                <Icon size={18} />
                {String(label)}
              </Link>
            ))}
          </nav>
          <LogoutButton />
        </aside>
        <section>
          <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Interface vendeur sécurisée</p>
            <h1 className="text-3xl font-black">{title}</h1>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
