"use client";

import { useEffect, useRef, useState } from "react";

type ToneKind = "order" | "payment" | "client";

function playTone(kind: ToneKind) {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  void ctx.resume();
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  master.gain.value = 0.48;
  compressor.threshold.value = -24;
  compressor.knee.value = 20;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  master.connect(compressor);
  compressor.connect(ctx.destination);

  const patterns: Record<ToneKind, { f: number; t: number }[]> = {
    order: [
      { f: 740, t: 0 },
      { f: 988, t: 0.16 },
      { f: 1175, t: 0.32 },
    ],
    payment: [
      { f: 392, t: 0 },
      { f: 523, t: 0.16 },
      { f: 659, t: 0.32 },
      { f: 784, t: 0.48 },
    ],
    client: [
      { f: 880, t: 0 },
      { f: 659, t: 0.2 },
      { f: 988, t: 0.4 },
    ],
  };

  patterns[kind].forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === "payment" ? "triangle" : "sine";
    osc.frequency.value = note.f;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + note.t);
    gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + note.t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + note.t + 0.22);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime + note.t);
    osc.stop(ctx.currentTime + note.t + 0.24);
  });

  window.setTimeout(() => void ctx.close(), 1200);
}

function useSoundUnlock(storageKey: string) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    window.setTimeout(() => setEnabled(window.localStorage.getItem(storageKey) === "enabled"), 0);
    const unlock = () => {
      if (window.localStorage.getItem(storageKey) === "enabled") return;
      window.localStorage.setItem(storageKey, "enabled");
      setEnabled(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [storageKey]);

  function enable(kind: ToneKind = "client") {
    window.localStorage.setItem(storageKey, "enabled");
    setEnabled(true);
    playTone(kind);
  }

  return { enabled, enable };
}

export function AdminSoundNotifier() {
  const { enabled, enable } = useSoundUnlock("central_marcher_admin_sounds");
  const baseline = useRef(false);

  useEffect(() => {
    let active = true;
    async function tick() {
      const response = await fetch("/api/admin/alerts", { cache: "no-store" }).catch(() => null);
      if (!active || !response?.ok) return;
      const data = await response.json().catch(() => null);
      if (!data) return;

      const lastOrderKey = "central_marcher_last_order_alert";
      const lastPaymentKey = "central_marcher_last_payment_alert";
      const previousOrder = window.localStorage.getItem(lastOrderKey);
      const previousPayment = window.localStorage.getItem(lastPaymentKey);

      if (!baseline.current) {
        window.localStorage.setItem(lastOrderKey, data.orderSignature || "");
        window.localStorage.setItem(lastPaymentKey, data.paymentSignature || "");
        baseline.current = true;
        return;
      }

      if (enabled && data.orderSignature && previousOrder && data.orderSignature !== previousOrder) playTone("order");
      if (enabled && data.paymentSignature && previousPayment && data.paymentSignature !== previousPayment) playTone("payment");
      window.localStorage.setItem(lastOrderKey, data.orderSignature || "");
      window.localStorage.setItem(lastPaymentKey, data.paymentSignature || "");
    }

    tick();
    const interval = window.setInterval(tick, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [enabled]);

  if (enabled) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Sons actifs</span>
        <button type="button" className="rounded-md border border-blue-200 px-3 py-2 text-xs font-black text-blue-900" onClick={() => playTone("order")} suppressHydrationWarning>
          Test commande
        </button>
        <button type="button" className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-900" onClick={() => playTone("payment")} suppressHydrationWarning>
          Test paiement
        </button>
      </div>
    );
  }
  return (
    <button type="button" className="btn-secondary" onClick={() => enable("payment")} suppressHydrationWarning>
      Activer sons
    </button>
  );
}

export function ClientSoundNotifier() {
  const { enabled, enable } = useSoundUnlock("central_marcher_client_sounds");
  const baseline = useRef(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function tick() {
      const response = await fetch("/api/account/alerts", { cache: "no-store" }).catch(() => null);
      if (!active || !response?.ok) return;
      const data = await response.json().catch(() => null);
      if (!data) return;
      if (!data.authenticated) {
        setAvailable(false);
        return;
      }
      setAvailable(true);
      const key = "central_marcher_client_status_alert";
      const previous = window.localStorage.getItem(key);
      if (!baseline.current) {
        window.localStorage.setItem(key, data.signature || "");
        baseline.current = true;
        return;
      }
      if (enabled && data.signature && previous && data.signature !== previous) {
        playTone(data.latestOrderStatus === "Livrée" ? "payment" : "client");
      }
      window.localStorage.setItem(key, data.signature || "");
    }
    tick();
    const interval = window.setInterval(tick, 4000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [enabled]);

  if (!available) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {enabled ? (
        <button
          type="button"
          className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-lg"
          onClick={() => playTone("client")}
          suppressHydrationWarning
        >
          Sons client actifs
        </button>
      ) : (
        <button
          type="button"
          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg"
          onClick={() => enable("client")}
          suppressHydrationWarning
        >
          Activer sons client
        </button>
      )}
    </div>
  );
}
