"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerStatusControl({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus || "active");
  const [message, setMessage] = useState("");

  async function save() {
    const response = await fetch(`/api/admin/customers/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMessage(response.ok ? "Statut mis à jour." : "Erreur statut.");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="active">Actif</option>
        <option value="suspended">Suspendu</option>
        <option value="banned">Banni</option>
      </select>
      <button className="btn-primary" onClick={save}>Modifier statut compte</button>
      {message && <p className="text-sm font-bold text-emerald-700">{message}</p>}
    </div>
  );
}
