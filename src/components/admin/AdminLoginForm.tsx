"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("Email ou mot de passe admin invalide.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="panel mx-auto mt-12 grid max-w-md gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Admin login</p>
        <h1 className="text-3xl font-black">Dashboard sécurisé</h1>
      </div>
      <input className="field" name="email" type="email" defaultValue="admin@store.com" />
      <input className="field" name="password" type="password" defaultValue="Admin123456!" />
      {error && <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button className="btn-primary h-12" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </button>
      <p className="text-xs text-slate-500">Compte par défaut: admin@store.com / Admin123456!</p>
    </form>
  );
}
