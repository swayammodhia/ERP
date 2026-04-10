"use client";

import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch, apiSend } from "@/components/erp/fetcher";

type Warehouse = { id: string; code: string; name: string; location?: string | null };
type Product = { id: string; name: string; sku: string };
type Transfer = { id: string; transferNumber: number; status: string; fromWarehouse: { name: string }; toWarehouse: { name: string } };

export default function WarehousePage() {
  const queryClient = useQueryClient();
  const warehouses = useQuery({ queryKey: ["warehouses"], queryFn: () => apiFetch<Warehouse[]>("/api/warehouses") });
  const products = useQuery({ queryKey: ["products"], queryFn: () => apiFetch<Product[]>("/api/products") });
  const transfers = useQuery({ queryKey: ["transfers"], queryFn: () => apiFetch<Transfer[]>("/api/warehouse/transfers") });

  const addWarehouse = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/warehouses", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const addTransfer = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/warehouse/transfers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transfers"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
      ]);
    },
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Warehouses" value={warehouses.data?.length ?? 0} />
        <KpiCard title="Transfer Orders" value={transfers.data?.length ?? 0} />
        <KpiCard title="In Transit" value={(transfers.data ?? []).filter((t) => t.status === "IN_TRANSIT").length} />
        <KpiCard title="Completed" value={(transfers.data ?? []).filter((t) => t.status === "COMPLETED").length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Add Warehouse">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addWarehouse.mutate({
                code: form.get("code"),
                name: form.get("name"),
                location: form.get("location") || undefined,
              });
              event.currentTarget.reset();
            }}
          >
            <input name="code" placeholder="Warehouse Code" className="erp-input" required />
            <input name="name" placeholder="Warehouse Name" className="erp-input" required />
            <input name="location" placeholder="Location" className="erp-input" />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addWarehouse.isPending}>
              {addWarehouse.isPending ? "Saving..." : "Create Warehouse"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Create Transfer">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addTransfer.mutate({
                fromWarehouseId: form.get("fromWarehouseId"),
                toWarehouseId: form.get("toWarehouseId"),
                status: form.get("status"),
                note: form.get("note") || undefined,
                items: [
                  {
                    productId: form.get("productId"),
                    quantity: Number(form.get("quantity") ?? 1),
                    unitCost: Number(form.get("unitCost") ?? 0),
                  },
                ],
              });
              event.currentTarget.reset();
            }}
          >
            <select name="fromWarehouseId" className="erp-input" required>
              <option value="">From warehouse</option>
              {(warehouses.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select name="toWarehouseId" className="erp-input" required>
              <option value="">To warehouse</option>
              {(warehouses.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select name="productId" className="erp-input" required>
              <option value="">Product</option>
              {(products.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="quantity" type="number" min={1} defaultValue={1} className="erp-input" required />
              <input name="unitCost" type="number" min={0} step="0.01" defaultValue={0} className="erp-input" required />
            </div>
            <select name="status" className="erp-input" defaultValue="IN_TRANSIT">
              <option value="DRAFT">DRAFT</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <input name="note" placeholder="Note" className="erp-input" />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addTransfer.isPending}>
              {addTransfer.isPending ? "Creating..." : "Create Transfer"}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
