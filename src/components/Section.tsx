import Link from "next/link";
import { ReactNode } from "react";

export function Section({
  title,
  eyebrow,
  href,
  children,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">{eyebrow}</p>}
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="text-sm font-bold text-emerald-700 hover:text-emerald-900">
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
