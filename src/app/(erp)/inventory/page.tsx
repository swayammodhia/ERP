"use client";

import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch, apiSend } from "@/components/erp/fetcher";

type Product = { id: string; sku: string; name: string };
type Inventory = { id: string; productId: string; onHandQty: number; product: { name: string; sku: string; reorderLevel: number } };

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: () => apiFetch<Product[]>("/api/products") });
  const stock = useQuery({ queryKey: ["inventory"], queryFn: () => apiFetch<Inventory[]>("/api/inventory") });

  const addProduct = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/products", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ]);
    },
  });

  const adjust = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/inventory", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ]);
    },
  });

  const low = (stock.data ?? []).filter((s) => s.onHandQty <= s.product.reorderLevel);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Products" value={products.data?.length ?? 0} />
        <KpiCard title="Inventory SKUs" value={stock.data?.length ?? 0} />
        <KpiCard title="Low Stock" value={low.length} />
        <KpiCard title="Healthy SKUs" value={(stock.data?.length ?? 0) - low.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Add Product">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addProduct.mutate({
                sku: form.get("sku"),
                name: form.get("name"),
                sellingPrice: Number(form.get("sellingPrice") ?? 0),
                costPrice: Number(form.get("costPrice") ?? 0),
                taxRate: Number(form.get("taxRate") ?? 0),
                reorderLevel: Number(form.get("reorderLevel") ?? 0),
                openingStock: Number(form.get("openingStock") ?? 0),
              });
              event.currentTarget.reset();
            }}
          >
            <input name="sku" placeholder="SKU" className="erp-input" required />
            <input name="name" placeholder="Product Name" className="erp-input" required />
            <div className="grid grid-cols-2 gap-2">
              <input name="sellingPrice" type="number" min={0.01} step="0.01" placeholder="Selling Price" className="erp-input" required />
              <input name="costPrice" type="number" min={0} step="0.01" placeholder="Cost Price" className="erp-input" required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input name="taxRate" type="number" min={0} step="0.01" placeholder="Tax %" className="erp-input" defaultValue={0} />
              <input name="reorderLevel" type="number" min={0} placeholder="Reorder" className="erp-input" defaultValue={0} />
              <input name="openingStock" type="number" min={0} placeholder="Opening" className="erp-input" defaultValue={0} />
            </div>
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addProduct.isPending}>
              {addProduct.isPending ? "Saving..." : "Create Product"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Stock Adjustment">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              adjust.mutate({
                productId: form.get("productId"),
                quantityDelta: Number(form.get("quantityDelta") ?? 0),
                note: form.get("note") || undefined,
              });
              event.currentTarget.reset();
            }}
          >
            <select name="productId" className="erp-input" required>
              <option value="">Select product</option>
              {(stock.data ?? []).map((item) => (
                <option key={item.id} value={item.productId}>
                  {item.product.name} ({item.product.sku}) - {item.onHandQty}
                </option>
              ))}
            </select>
            <input name="quantityDelta" type="number" placeholder="+/- Quantity" className="erp-input" required />
            <input name="note" placeholder="Note" className="erp-input" />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={adjust.isPending}>
              {adjust.isPending ? "Updating..." : "Apply Adjustment"}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
