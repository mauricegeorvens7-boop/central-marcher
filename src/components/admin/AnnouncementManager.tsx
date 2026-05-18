"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbAnnouncement } from "@/lib/db";
import { ImageUploadField } from "./ImageUploadField";

type AnnouncementForm = {
  id: string;
  text: string;
  link: string;
  imageUrl: string;
  publicId: string | null;
  type: DbAnnouncement["type"];
  startDate: string;
  endDate: string;
  active: number;
};

const empty: AnnouncementForm = {
  id: "",
  text: "",
  link: "",
  imageUrl: "",
  publicId: null as string | null,
  type: "top_bar",
  startDate: "2026-01-01",
  endDate: "2027-01-01",
  active: 1,
};

export function AnnouncementManager({ announcements }: { announcements: DbAnnouncement[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(empty);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = editing.id ? `/api/admin/announcements/${editing.id}` : "/api/admin/announcements";
    await fetch(url, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, active: Boolean(editing.active) }),
    });
    setEditing(empty);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="panel">
        <h2 className="mb-4 text-xl font-black">Annonces</h2>
        <div className="grid gap-3">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-black">{announcement.text}</h3>
                  <p className="text-sm text-slate-600">{announcement.type} | {announcement.active ? "active" : "inactive"} | {announcement.startDate} - {announcement.endDate}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => setEditing({ ...announcement, imageUrl: announcement.imageUrl || "", link: announcement.link || "", active: announcement.active ? 1 : 0 })}>Edit</button>
                  <button className="btn-secondary border-red-200 text-red-700" onClick={() => remove(announcement.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <form onSubmit={submit} className="panel grid gap-3">
        <h2 className="text-xl font-black">{editing.id ? "Modifier annonce" : "Ajouter annonce"}</h2>
        <textarea className="min-h-24 rounded-md border border-slate-300 p-3 text-sm outline-none" placeholder="Texte annonce" value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
        <input className="field" placeholder="Lien optionnel" value={editing.link || ""} onChange={(e) => setEditing({ ...editing, link: e.target.value })} />
        <ImageUploadField label="Image optionnelle" value={editing.imageUrl || ""} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(payload) => setEditing({ ...editing, imageUrl: payload.url, publicId: payload.publicId || null })} />
        <select className="field" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as typeof editing.type })}>
          <option value="top_bar">top bar</option>
          <option value="popup">popup</option>
          <option value="product_promo">product promo</option>
          <option value="homepage_section">homepage section</option>
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" type="date" value={editing.startDate.slice(0, 10)} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
          <input className="field" type="date" value={editing.endDate.slice(0, 10)} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(editing.active)} onChange={(e) => setEditing({ ...editing, active: e.target.checked ? 1 : 0 })} /> Active</label>
        <button className="btn-primary">Save announcement</button>
      </form>
    </div>
  );
}
