"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { ERP_NAV } from "@/components/erp/config";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  const handleSignOut = async () => {
    if (isAdminRoute) {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
      return;
    }

    router.push("/dashboard");
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof ERP_NAV>();
    for (const item of ERP_NAV) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, []);

  const active = ERP_NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className={`flex h-screen overflow-hidden text-slate-900 ${isAdminRoute ? "bg-[#f7f3ff]" : "bg-[#f2f4f8]"}`}>
      <aside
        className={`${sidebarOpen ? "w-72" : "w-20"} flex h-full flex-col border-r border-slate-800 text-slate-200 transition-all duration-300 ${
          isAdminRoute ? "bg-[#1f103b]" : "bg-[#0f1430]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen ? (
              <div className="truncate">
                <p className="truncate text-sm font-semibold text-cyan-300">Swayam ERP</p>
                <p className="text-xs text-slate-400">{isAdminRoute ? "Admin Command Center" : "Enterprise ERP Suite"}</p>
              </div>
            ) : null}
          </div>
          <button
            className="rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {grouped.map(([group, items]) => (
            <div key={group} className="mb-5">
              {sidebarOpen ? (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{group}</p>
              ) : null}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        selected
                          ? "bg-gradient-to-r from-indigo-600/60 to-blue-600/40 font-semibold text-white shadow"
                          : "text-slate-300 hover:bg-slate-700/70 hover:text-white"
                      }`}
                      title={item.label}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-700 p-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen ? <span>{isAdminRoute ? "Admin Sign Out" : "User Sign Out"}</span> : null}
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className={`border-b border-slate-200 px-6 py-4 shadow-sm ${isAdminRoute ? "bg-[#fff7ff]" : "bg-white"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{active?.group ?? "Core"}</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{active?.label ?? "Executive Dashboard"}</h1>
            {isAdminRoute ? (
              <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-700">
                Admin Mode
              </span>
            ) : null}
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
