"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Home, Lock, MessageSquare, UserRound, WalletCards } from "lucide-react";
import { money } from "@/lib/data";
import type { DbUser, PaymentTransaction, SupportTicket } from "@/lib/db";

type Address = { id: string; label: string; name: string; line1: string; city: string; province: string; postalCode: string; phone: string | null; isDefault: number };

export function AccountSettingsClient({
  user,
  addresses,
  transactions,
  tickets,
}: {
  user: DbUser;
  addresses: Address[];
  transactions: PaymentTransaction[];
  tickets: SupportTicket[];
}) {
  const router = useRouter();
  const settings = JSON.parse(user.settings || "{}") as { language?: string };
  const [profile, setProfile] = useState({
    firstName: user.firstName || user.name.split(" ")[0] || "",
    lastName: user.lastName || user.name.split(" ").slice(1).join(" "),
    gender: user.gender || "",
    birthDate: user.birthDate || "",
    phone: user.phone || "",
    email: user.email,
    language: settings.language || "fr",
    profilePhoto: user.profilePhoto || "",
    coverPhoto: user.coverPhoto || "",
  });
  const [password, setPassword] = useState({ currentPassword: "", nextPassword: "" });
  const [address, setAddress] = useState({ label: "Maison", name: user.name, line1: "", city: "", province: "", postalCode: "", phone: user.phone || "", isDefault: false });
  const [support, setSupport] = useState({ subject: "", message: "" });
  const [rechargeStatus, setRechargeStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState("");

  const recharges = useMemo(() => {
    return transactions.filter((tx) => tx.type === "recharge" && (rechargeStatus === "all" || tx.status === rechargeStatus));
  }, [transactions, rechargeStatus]);
  const balanceMovements = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === "recharge" || tx.method === "balance")
      .map((tx) => ({
        ...tx,
        direction: tx.type === "recharge" ? "credit" : "debit",
        label: tx.type === "recharge" ? "Recharge confirmée" : "Achat payé avec solde",
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions]);

  async function send(url: string, body: unknown, method = "PUT") {
    setMessage("");
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(result.error || "Action impossible.");
      return false;
    }
    setMessage("Sauvegardé.");
    router.refresh();
    return true;
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    await send("/api/account/profile", profile);
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (await send("/api/account/password", password)) setPassword({ currentPassword: "", nextPassword: "" });
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    if (await send("/api/account/addresses", address, "POST")) setAddress({ label: "Maison", name: user.name, line1: "", city: "", province: "", postalCode: "", phone: user.phone || "", isDefault: false });
  }

  async function removeAddress(id: string) {
    await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function sendSupport(event: FormEvent) {
    event.preventDefault();
    if (await send("/api/support", { name: user.name, email: user.email, ...support }, "POST")) setSupport({ subject: "", message: "" });
  }

  async function uploadPhoto(file: File | undefined, target: "profilePhoto" | "coverPhoto") {
    if (!file) return;
    setUploading(target);
    setMessage("");
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/account/upload", { method: "POST", body: data });
    const result = await response.json().catch(() => ({}));
    setUploading("");
    if (!response.ok) {
      setMessage(result.error || "Upload impossible.");
      return;
    }
    setProfile({ ...profile, [target]: result.secure_url });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-36 bg-slate-950">
          {profile.coverPhoto && <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${profile.coverPhoto})` }} />}
        </div>
        <div className="p-5">
          <h1 className="text-3xl font-black">Paramètres compte</h1>
          <p className="mt-1 text-slate-600">Profil, sécurité, adresses, recharges et support client.</p>
          {message && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit lg:sticky lg:top-28">
          {[
            [UserRound, "Informations personnelles", "#profile"],
            [Lock, "Sécurité compte", "#security"],
            [Home, "Adresses", "#addresses"],
            [WalletCards, "Historique recharges", "#recharges"],
            [MessageSquare, "Support client", "#support"],
            [Bell, "Activité récente", "#activity"],
          ].map(([Icon, label, href]) => (
            <a key={String(label)} href={String(href)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-100">
              <Icon size={18} /> {String(label)}
            </a>
          ))}
        </aside>

        <section className="grid gap-6">
          <form id="profile" onSubmit={saveProfile} className="panel scroll-mt-28">
            <h2 className="text-xl font-black">Informations personnelles</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Photo profil
                <input
                  className="field pt-2"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => uploadPhoto(event.target.files?.[0], "profilePhoto")}
                />
                <span className="text-xs font-semibold text-slate-500">{uploading === "profilePhoto" ? "Upload en cours..." : "JPG, PNG, WEBP ou GIF, max 5MB."}</span>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Photo couverture
                <input
                  className="field pt-2"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => uploadPhoto(event.target.files?.[0], "coverPhoto")}
                />
                <span className="text-xs font-semibold text-slate-500">{uploading === "coverPhoto" ? "Upload en cours..." : "Optionnel, affichée en haut du profil."}</span>
              </label>
              <input className="field" placeholder="Prénom" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
              <input className="field" placeholder="Nom" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
              <select className="field" value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                <option value="">Sexe</option>
                <option value="Femme">Femme</option>
                <option value="Homme">Homme</option>
                <option value="Autre">Autre</option>
              </select>
              <input className="field" type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} />
              <input className="field" placeholder="Téléphone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              <input className="field" type="email" placeholder="Email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              <select className="field" value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <button className="btn-primary mt-4">Sauvegarder profil</button>
          </form>

          <form id="security" onSubmit={savePassword} className="panel scroll-mt-28">
            <h2 className="text-xl font-black">Sécurité compte</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="field" type="password" placeholder="Mot de passe actuel" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} />
              <input className="field" type="password" placeholder="Nouveau mot de passe" value={password.nextPassword} onChange={(e) => setPassword({ ...password, nextPassword: e.target.value })} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {["Double authentification bientôt", "Appareils connectés bientôt", "Déconnexion de tous les appareils bientôt"].map((item) => <p key={item} className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-600">{item}</p>)}
            </div>
            <button className="btn-primary mt-4">Changer mot de passe</button>
          </form>

          <section id="addresses" className="panel scroll-mt-28">
            <h2 className="text-xl font-black">Adresses</h2>
            <form onSubmit={saveAddress} className="mt-4 grid gap-3 md:grid-cols-3">
              <select className="field" value={address.label} onChange={(e) => setAddress({ ...address, label: e.target.value })}>
                <option>Maison</option><option>Travail</option><option>Pickup</option>
              </select>
              <input className="field" placeholder="Nom réception" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
              <input className="field" placeholder="Téléphone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
              <input className="field md:col-span-3" placeholder="Adresse complète" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
              <input className="field" placeholder="Ville" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <input className="field" placeholder="Province" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })} />
              <input className="field" placeholder="Code postal" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={address.isDefault} onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })} /> Adresse par défaut</label>
              <button className="btn-primary md:col-span-2">Ajouter adresse</button>
            </form>
            <div className="mt-4 grid gap-3">
              {addresses.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p><strong>{item.label}</strong> {item.isDefault ? "(défaut)" : ""}<br /><span className="text-sm text-slate-600">{item.line1}, {item.city}, {item.province} {item.postalCode}</span></p>
                  <button className="btn-secondary border-red-200 text-red-700" onClick={() => removeAddress(item.id)}>Supprimer</button>
                </div>
              ))}
            </div>
          </section>

          <section id="recharges" className="panel scroll-mt-28">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-black">Historique recharges</h2>
              <select className="field max-w-48" value={rechargeStatus} onChange={(e) => setRechargeStatus(e.target.value)}>
                <option value="all">Toutes</option><option value="pending">Pending</option><option value="paid">Confirmées</option><option value="rejected">Refusées</option>
              </select>
            </div>
            <div className="mt-4 grid gap-3">
              {recharges.map((tx) => <div key={tx.id} className="rounded-md border border-slate-200 p-3"><strong>{tx.transactionNo}</strong><p className="text-sm text-slate-600">{tx.method} | {tx.status} | {new Date(tx.createdAt).toLocaleString("fr-CA")}</p><p className="font-black">{money(tx.amount)}</p></div>)}
              {!recharges.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucune recharge trouvée.</p>}
            </div>
          </section>

          <form id="support" onSubmit={sendSupport} className="panel scroll-mt-28">
            <h2 className="text-xl font-black">Support client</h2>
            <input className="field mt-4" placeholder="Sujet" value={support.subject} onChange={(e) => setSupport({ ...support, subject: e.target.value })} />
            <textarea className="mt-3 min-h-32 w-full rounded-md border border-slate-300 p-3" placeholder="Message" value={support.message} onChange={(e) => setSupport({ ...support, message: e.target.value })} />
            <button className="btn-primary mt-3">Envoyer message</button>
            <div className="mt-4 grid gap-2">
              {tickets.map((ticket) => <p key={ticket.id} className="rounded-md bg-slate-50 p-3 text-sm"><strong>{ticket.ticketNo}</strong> | {ticket.subject} | {ticket.status}</p>)}
            </div>
          </form>

          <section id="activity" className="panel scroll-mt-28">
            <h2 className="text-xl font-black">Activité récente</h2>
            <div className="mt-4 grid gap-2">
              <p className="rounded-md bg-slate-50 p-3 text-sm">Solde actuel: <strong>{money(user.balance)}</strong></p>
              <p className="rounded-md bg-slate-50 p-3 text-sm">Statut compte: <strong>{user.accountStatus}</strong></p>
              <p className="rounded-md bg-slate-50 p-3 text-sm">Notifications: <strong>{Object.keys(JSON.parse(user.notifications || "{}")).join(", ")}</strong></p>
            </div>
            <h3 className="mt-6 text-lg font-black">Mouvements du solde</h3>
            <div className="mt-3 grid gap-3">
              {balanceMovements.map((tx) => (
                <div key={tx.id} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black">{tx.label}</p>
                    <p className="text-sm text-slate-600">{tx.transactionNo} | {new Date(tx.createdAt).toLocaleString("fr-CA")}</p>
                  </div>
                  <p className={`text-xl font-black ${tx.direction === "credit" ? "text-emerald-700" : "text-red-700"}`}>
                    {tx.direction === "credit" ? "+" : "-"}{money(tx.amount)}
                  </p>
                </div>
              ))}
              {!balanceMovements.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Aucun mouvement de solde.</p>}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
