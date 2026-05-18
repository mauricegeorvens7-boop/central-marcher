"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForms() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError("Email ou mot de passe invalide.");
      return;
    }

    router.push(data.redirectTo || "/account");
    router.refresh();
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        phone: form.get("phone"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSignupLoading(false);

    if (!response.ok) {
      setSignupError(data.error || "Impossible de créer le compte.");
      return;
    }

    router.push(data.redirectTo || "/account");
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_0.95fr]">
      <section className="panel overflow-hidden">
        <div className="rounded-lg bg-slate-950 p-6 text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">Connexion intelligente</p>
          <h1 className="mt-2 text-4xl font-black">Bienvenue</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Votre univers shopping commence ici.
          </p>
        </div>
        <form onSubmit={signIn} className="mt-6 grid gap-3">
          <input className="field" name="email" placeholder="Email" type="email" defaultValue="admin@store.com" />
          <input className="field" name="password" placeholder="Mot de passe" type="password" defaultValue="Admin123456!" />
          {error && <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button className="btn-primary h-12 transition-transform duration-200 hover:-translate-y-0.5" disabled={loading}>
            {loading ? "Connexion..." : "Connexion"}
          </button>
        </form>
      </section>
      <section className="panel">
        <h2 className="text-3xl font-black">Créer un compte client</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Les profils clients sont sauvegardés avec informations personnelles, notifications, adresses, favoris et historique.
        </p>
        <form onSubmit={register} className="mt-5 grid gap-3">
          <input className="field" name="name" placeholder="Nom complet" />
          <input className="field" name="email" placeholder="Email" type="email" />
          <input className="field" name="phone" placeholder="Telephone" />
          <input className="field" name="password" placeholder="Mot de passe" type="password" />
          {signupError && <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{signupError}</p>}
          <button className="btn-primary h-12 transition-transform duration-200 hover:-translate-y-0.5" disabled={signupLoading}>
            {signupLoading ? "Creation..." : "Créer un compte"}
          </button>
        </form>
      </section>
    </div>
  );
}
