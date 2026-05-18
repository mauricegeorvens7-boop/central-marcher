"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Truck } from "lucide-react";

const statuses = ["Nouvelle commande", "En cours", "En livraison", "Livrée", "Annulée"];

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus || "Nouvelle commande");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function update(nextStatus = status) {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, note }),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error || "Impossible de modifier la commande.");
      return;
    }
    setStatus(nextStatus);
    setMessage("Statut mis à jour.");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-bold">
        Statut commande
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <textarea
        className="min-h-24 rounded-md border border-slate-300 p-3 text-sm"
        placeholder="Note admin ou tracking optionnel"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      {message && <p className="rounded-md bg-slate-100 p-3 text-sm font-bold">{message}</p>}
      <button className="btn-primary" disabled={loading} onClick={() => update()}>
        <CheckCircle2 size={18} /> {loading ? "Mise à jour..." : "Modifier statut"}
      </button>
      <button className="btn-secondary" disabled={loading} onClick={() => update("Livrée")}>
        <Truck size={18} /> Confirmer livraison
      </button>
    </div>
  );
}
