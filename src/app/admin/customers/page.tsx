import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, UserRound } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { getCustomers } from "@/lib/db";
import { money } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = getCustomers();

  return (
    <AdminShell title="Gestion clients">
      <section className="grid gap-4">
        {customers.map((customer) => (
          <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300">
            <div className="grid gap-4 md:grid-cols-[72px_1fr_auto] md:items-center">
              <div className="relative size-16 overflow-hidden rounded-full bg-slate-100">
                {customer.profilePhoto ? <Image src={customer.profilePhoto} alt={customer.name} fill className="object-cover" sizes="64px" /> : <UserRound className="m-5 text-slate-400" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">{customer.name}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${customer.accountStatus === "active" ? "bg-emerald-100 text-emerald-800" : customer.accountStatus === "banned" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{customer.accountStatus}</span>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Mail size={15} /> {customer.email}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Phone size={15} /> {customer.phone || "Téléphone absent"}</p>
              </div>
              <p className="text-xl font-black text-emerald-700">{money(customer.balance)}</p>
            </div>
          </Link>
        ))}
        {!customers.length && <p className="panel text-sm text-slate-600">Aucun client.</p>}
      </section>
    </AdminShell>
  );
}
