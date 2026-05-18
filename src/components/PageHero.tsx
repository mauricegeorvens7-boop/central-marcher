import { ReactNode } from "react";

export function PageHero({ title, copy, children }: { title: string; copy: string; children?: ReactNode }) {
  return (
    <section className="border-b border-slate-200 bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{copy}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
