"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={logout} className="mt-3 w-full rounded-md border border-white/20 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
      Logout
    </button>
  );
}
