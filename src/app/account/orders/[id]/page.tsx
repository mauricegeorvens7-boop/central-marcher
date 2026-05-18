import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/admin/auth";
import { getOrderForUserById } from "@/lib/db";
import { money } from "@/lib/data";

export const dynamic = "force-dynamic";

const steps = ["Nouvelle commande", "En cours", "En livraison", "Livrée"];

function normalizedStatus(status: string) {
  if (status === "Processing") return "En cours";
  if (status === "Delivered") return "Livrée";
  if (status === "Waiting payment") return "Nouvelle commande";
  return status || "Nouvelle commande";
}

function clientMessage(status: string) {
  if (status === "En cours") return "Votre commande est en cours de traitement.";
  if (status === "En livraison") return "Votre commande est en route.";
  if (status === "Livrée") return "Livraison réussie.";
  if (status === "Annulée") return "Commande annulée.";
  return "Nouvelle commande reçue.";
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const order = getOrderForUserById(user.id, id);
  if (!order) notFound();

  const status = normalizedStatus(order.fulfillmentStatus);
  const currentStep = status === "Annulée" ? -1 : Math.max(0, steps.indexOf(status));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-black text-emerald-700">
        <ArrowLeft size={17} /> Retour historique
      </Link>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Suivi {order.orderNo}</h1>
          <p className="mt-2 text-slate-600">{clientMessage(status)} | Paiement {order.paymentStatus}</p>
        </div>
        <p className="text-2xl font-black">{money(order.total)}</p>
      </div>

      <div className="panel mt-6">
        <div className="grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className={`rounded-md p-3 text-sm font-bold ${index <= currentStep ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
              {step}
            </div>
          ))}
        </div>
        {status === "Annulée" && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-800">Cette commande est annulée.</p>}
      </div>

      <div className="mt-6 grid gap-4">
        {order.items.map((product, index) => (
          <div key={`${product.id || product.name}-${index}`} className="panel grid gap-3 sm:grid-cols-[72px_1fr_auto] sm:items-center">
            <div className="relative size-16 overflow-hidden rounded-md bg-slate-50">
              {product.image && <Image src={product.image} alt={product.name} fill className="object-contain p-1" sizes="64px" />}
            </div>
            <div>
              <p className="font-bold">{product.name}</p>
              <p className="text-sm text-slate-600">{product.variantLabel || "Aucune variante"} | Qté {product.quantity}</p>
            </div>
            <span className="font-black">{money(product.price * product.quantity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
