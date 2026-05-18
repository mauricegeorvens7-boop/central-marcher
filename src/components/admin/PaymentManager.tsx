"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, Search, XCircle } from "lucide-react";
import { money } from "@/lib/data";
import type { PaymentSettings, PaymentTransaction } from "@/lib/db";

export function PaymentManager({ settings, transactions }: { settings: PaymentSettings; transactions: PaymentTransaction[] }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [filters, setFilters] = useState({
    query: "",
    status: "all",
    method: "all",
    type: "all",
    startDate: "",
    endDate: "",
  });
  const sortedTransactions = useMemo(() => {
    const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`).getTime() : null;
    const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`).getTime() : null;
    const q = filters.query.toLowerCase().trim();

    return [...transactions]
      .filter((tx) => {
        const createdAt = new Date(tx.createdAt).getTime();
        const haystack = `${tx.transactionNo} ${tx.customerName} ${tx.customerEmail} ${tx.customerPhone} ${tx.payerPhone || ""}`.toLowerCase();
        return (
          (!q || haystack.includes(q)) &&
          (filters.status === "all" || tx.status === filters.status) &&
          (filters.method === "all" || tx.method === filters.method) &&
          (filters.type === "all" || tx.type === filters.type) &&
          (start === null || createdAt >= start) &&
          (end === null || createdAt <= end)
        );
      })
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filters, transactions]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetch("/api/admin/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.refresh();
  }

  async function update(id: string, status: "paid" | "rejected") {
    await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: notes[id] || "" }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={saveSettings} className="panel">
        <h2 className="text-xl font-black">Configuration MonCash / NatCash</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold">
            MonCash
            <input className="field" placeholder="Numéro MonCash" value={form.moncashNumber} onChange={(e) => setForm({ ...form, moncashNumber: e.target.value })} />
            <span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.moncashEnabled)} onChange={(e) => setForm({ ...form, moncashEnabled: e.target.checked ? 1 : 0 })} /> Activer MonCash</span>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            NatCash
            <input className="field" placeholder="Numéro NatCash" value={form.natcashNumber} onChange={(e) => setForm({ ...form, natcashNumber: e.target.value })} />
            <span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.natcashEnabled)} onChange={(e) => setForm({ ...form, natcashEnabled: e.target.checked ? 1 : 0 })} /> Activer NatCash</span>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Paiement livraison
            <span className="flex h-11 items-center gap-2 rounded-md border border-slate-200 px-3"><input type="checkbox" checked={Boolean(form.cashOnDeliveryEnabled)} onChange={(e) => setForm({ ...form, cashOnDeliveryEnabled: e.target.checked ? 1 : 0 })} /> Activer</span>
          </label>
        </div>
        <button className="btn-primary mt-5">Sauvegarder</button>
      </form>

      <section className="panel">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Preuves de paiement et recharges</h2>
            <p className="mt-1 text-sm text-slate-600">{sortedTransactions.length} résultat(s) sur {transactions.length}</p>
          </div>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setFilters({ query: "", status: "all", method: "all", type: "all", startDate: "", endDate: "" })}
          >
            Réinitialiser
          </button>
        </div>
        <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
            <Search size={17} className="text-slate-400" />
            <input
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder="Client, email, téléphone, transaction"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            />
          </label>
          <select className="field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">Tous statuts</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="field" value={filters.method} onChange={(event) => setFilters({ ...filters, method: event.target.value })}>
            <option value="all">Toutes méthodes</option>
            <option value="moncash">MonCash</option>
            <option value="natcash">NatCash</option>
          </select>
          <select className="field" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="all">Tous types</option>
            <option value="recharge">Recharge</option>
            <option value="order">Commande</option>
          </select>
          <input className="field" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} />
          <input className="field" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} />
        </div>
        <div className="mt-4 grid gap-4">
          {sortedTransactions.map((tx) => (
            <article key={tx.id} className={`rounded-lg border p-4 ${tx.status === "pending" ? "border-amber-300 bg-amber-50/60" : "border-slate-200"}`}>
              <div className="grid gap-4 lg:grid-cols-[160px_1fr_260px]">
                {tx.proofUrl ? (
                  <button
                    type="button"
                    className="relative h-36 overflow-hidden rounded-md bg-slate-100 ring-offset-2 transition hover:ring-2 hover:ring-emerald-500"
                    onClick={() => setPreview({ url: tx.proofUrl || "", title: tx.transactionNo })}
                    aria-label="Prévisualiser la preuve de paiement"
                  >
                    <Image src={tx.proofUrl} alt="Preuve paiement" fill className="object-contain" sizes="160px" />
                  </button>
                ) : (
                  <div className="relative h-36 overflow-hidden rounded-md bg-slate-100">
                    <div className="grid h-full place-items-center text-xs font-bold text-slate-500">Aucune preuve</div>
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-slate-100 text-slate-700">{tx.type}</span>
                    <span className="badge bg-emerald-100 text-emerald-800">{tx.method}</span>
                    <span className={`badge ${tx.status === "paid" ? "bg-emerald-600 text-white" : tx.status === "rejected" ? "bg-red-600 text-white" : "bg-amber-300 text-slate-950"}`}>{tx.status}</span>
                  </div>
                  <h3 className="mt-3 font-black">{tx.transactionNo}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CalendarClock size={16} />
                    {new Date(tx.createdAt).toLocaleDateString("fr-CA")} à {new Date(tx.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Client: {tx.customerName} | {tx.customerEmail} | {tx.customerPhone}</p>
                  <p className="mt-1 text-sm text-slate-600">Numéro payé: {tx.payerPhone || "N/A"}</p>
                  <p className="mt-2 text-2xl font-black">{money(tx.amount)}</p>
                  {tx.orderId && <p className="mt-1 text-xs font-bold text-slate-500">Commande associée: {tx.orderId}</p>}
                  {!tx.orderId && tx.type === "recharge" && <p className="mt-1 text-xs font-bold text-slate-500">Recharge de solde client</p>}
                </div>
                <div className="grid content-start gap-3">
                  <textarea className="min-h-20 rounded-md border border-slate-300 p-3 text-sm" placeholder="Note admin" value={notes[tx.id] ?? tx.adminNote ?? ""} onChange={(e) => setNotes({ ...notes, [tx.id]: e.target.value })} />
                  {tx.status === "pending" && (
                    <>
                      <button className="btn-primary" onClick={() => update(tx.id, "paid")}><CheckCircle2 size={18} /> Confirmer</button>
                      <button className="btn-secondary border-red-200 text-red-700" onClick={() => update(tx.id, "rejected")}><XCircle size={18} /> Refuser</button>
                    </>
                  )}
                  {tx.status === "paid" && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-800">
                      <div className="flex items-center gap-2"><CheckCircle2 size={18} /> Paiement déjà confirmé</div>
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        {tx.type === "recharge" ? "Le solde client a été crédité." : "La commande associée est passée à Paid / En cours."}
                      </p>
                    </div>
                  )}
                  {tx.status === "rejected" && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">
                      <div className="flex items-center gap-2"><XCircle size={18} /> Paiement refusé</div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!sortedTransactions.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucune preuve ne correspond aux filtres.</p>}
        </div>
      </section>
      {preview && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
        >
          <div className="w-full max-w-4xl rounded-lg bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Preuve de paiement</p>
                <h3 className="text-lg font-black">{preview.title}</h3>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setPreview(null)}>
                Fermer
              </button>
            </div>
            <div className="relative h-[72vh] overflow-hidden rounded-lg bg-slate-100">
              <Image src={preview.url} alt="Prévisualisation preuve paiement" fill className="object-contain" sizes="90vw" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
