"use client";

import { useQuery } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch } from "@/components/erp/fetcher";

type Inventory = { id: string; onHandQty: number; product: { name: string; sku: string; reorderLevel: number } };

export default function ProcurementPage() {
  const stock = useQuery({ queryKey: ["inventory"], queryFn: () => apiFetch<Inventory[]>("/api/inventory") });
  const low = (stock.data ?? []).filter((s) => s.onHandQty <= s.product.reorderLevel);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Reorder Candidates" value={low.length} hint="From inventory policy" />
        <KpiCard title="Critical Items" value={low.filter((i) => i.onHandQty === 0).length} />
        <KpiCard title="Review Queue" value={(stock.data ?? []).length} />
        <KpiCard title="PO Status" value="Open" hint="Workflow enabled" />
      </div>

      <SectionCard title="Suggested Reorder List">
        <div className="grid gap-2 text-sm">
          {low.slice(0, 20).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-800">{item.product.name} ({item.product.sku})</span>
              <span className="text-xs text-slate-600">Stock {item.onHandQty} / Reorder {item.product.reorderLevel}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
