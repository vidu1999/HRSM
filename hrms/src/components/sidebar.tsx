"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { href: string; label: string; icon: string };

export function Sidebar({ items, user }: { items: Item[]; user: { name: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span aria-hidden className="w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto rounded-xl bg-white/5 p-3 text-sm">
      <div className="font-medium text-white">{user.name}</div>
      <div className="text-xs text-slate-400">{user.role}</div>
      <form action="/api/auth/logout" method="post" className="mt-3">
        <button className="w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20">Sign out</button>
      </form>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 flex items-center justify-between bg-navy-900 px-4 py-3 text-white lg:hidden">
        <span className="font-semibold">HRMS</span>
        <button onClick={() => setOpen((v) => !v)} className="rounded-md bg-white/10 px-3 py-1 text-sm" aria-expanded={open}>
          Menu
        </button>
      </div>
      <aside className={`${open ? "block" : "hidden"} bg-navy-900 p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:gap-6`}>
        <div className="hidden items-center gap-2 px-2 py-1 lg:flex">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 font-bold text-white">H</span>
          <div>
            <div className="font-semibold text-white">HRMS</div>
            <div className="text-xs text-slate-400">People platform</div>
          </div>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
