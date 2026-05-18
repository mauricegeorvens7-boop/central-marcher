"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import type { PaymentSettings } from "@/lib/db";

export function RechargeForm({ settings }: { settings: PaymentSettings }) {
  const [method, setMethod] = useState<"moncash" | "natcash">("moncash");
  const [amount, setAmount] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const number = method === "moncash" ? settings.moncashNumber : settings.natcashNumber;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData();
    data.set("method", method);
    data.set("amount", amount);
    data.set("payerPhone", payerPhone);
    if (proof) data.set("proof", proof);
    const response = await fetch("/api/recharge", { method: "POST", body: data });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Recharge envoyée. Elle sera créditée après validation admin." : result.error || "Erreur recharge.");
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!settings.moncashEnabled}
          onClick={() => setMethod("moncash")}
          className={`btn-secondary ${method === "moncash" ? "border-emerald-600 bg-emerald-50" : ""}`}
          suppressHydrationWarning
        >
          <span className="relative h-6 w-16 overflow-hidden rounded bg-white">
            <Image src="/moncash-logo.png" alt="MonCash" fill className="object-contain" sizes="64px" />
          </span>
          MonCash
        </button>
        <button
          type="button"
          disabled={!settings.natcashEnabled}
          onClick={() => setMethod("natcash")}
          className={`btn-secondary ${method === "natcash" ? "border-emerald-600 bg-emerald-50" : ""}`}
          suppressHydrationWarning
        >
          <span className="relative h-6 w-16 overflow-hidden rounded bg-white">
            <Image src="/natcash-logo.svg" alt="NatCash" fill className="object-contain" sizes="64px" />
          </span>
          NatCash
        </button>
      </div>
      <p className="rounded-md bg-white p-3 text-sm font-bold">Numéro recharge: {number || "Non configuré"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" type="number" step="0.01" placeholder="Montant envoyé" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="field" placeholder="Numéro utilisé" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} />
      </div>
      <input className="field pt-2" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setProof(e.target.files?.[0] || null)} />
      <button className="btn-primary" suppressHydrationWarning>Soumettre la recharge</button>
      {message && <p className="text-sm font-bold text-emerald-800">{message}</p>}
    </form>
  );
}
