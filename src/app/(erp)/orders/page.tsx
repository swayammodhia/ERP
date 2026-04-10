"use client";

import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch, apiSend } from "@/components/erp/fetcher";
import { fromMinorUnits } from "@/lib/money";

type Product = { id: string; name: string; sku: string; inventory?: { onHandQty: number } | null };
type Invoice = { id: string; invoiceNumber: number; status: string; balanceAmount: number };
type Payment = { id: string; amount: number; method: string; createdAt: string };

function money(value: number | string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(fromMinorUnits(value));
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: () => apiFetch<Product[]>("/api/products") });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => apiFetch<Invoice[]>("/api/invoices") });
  const payments = useQuery({ queryKey: ["payments"], queryFn: () => apiFetch<Payment[]>("/api/payments") });

  const checkout = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/pos/checkout", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ]);
    },
  });

  const addPayment = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/payments", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ]);
    },
  });

  const pending = (invoices.data ?? []).filter((i) => i.status !== "PAID");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Invoices" value={invoices.data?.length ?? 0} />
        <KpiCard title="Pending Invoices" value={pending.length} />
        <KpiCard title="Payments Received" value={payments.data?.length ?? 0} />
        <KpiCard title="Open Amount" value={money(pending.reduce((sum, i) => sum + Number(i.balanceAmount), 0))} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="POS Checkout">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              checkout.mutate({
                customerName: form.get("customerName") || undefined,
                paymentMethod: form.get("paymentMethod"),
                paidAmount: Number(form.get("paidAmount") ?? 0),
                items: [
                  {
                    productId: form.get("productId"),
                    quantity: Number(form.get("quantity") ?? 1),
                  },
                ],
              });
              event.currentTarget.reset();
            }}
          >
            <select name="productId" required className="erp-input">
              <option value="">Select product</option>
              {(products.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="quantity" type="number" min={1} defaultValue={1} className="erp-input" required />
              <input name="paidAmount" type="number" min={0} step="0.01" defaultValue={0} className="erp-input" required />
            </div>
            <select name="paymentMethod" className="erp-input" defaultValue="CASH">
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
              <option value="OTHER">OTHER</option>
            </select>
            <input name="customerName" placeholder="Customer name (optional)" className="erp-input" />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={checkout.isPending}>
              {checkout.isPending ? "Processing..." : "Create Sale"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Record Invoice Payment">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addPayment.mutate({
                invoiceId: form.get("invoiceId"),
                amount: Number(form.get("amount") ?? 0),
                method: form.get("method"),
                transactionRef: form.get("transactionRef") || undefined,
              });
              event.currentTarget.reset();
            }}
          >
            <select name="invoiceId" required className="erp-input">
              <option value="">Select pending invoice</option>
              {pending.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  INV-{inv.invoiceNumber} ({money(inv.balanceAmount)})
                </option>
              ))}
            </select>
            <input name="amount" type="number" min={0.01} step="0.01" placeholder="Amount" className="erp-input" required />
            <select name="method" className="erp-input" defaultValue="CASH">
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
              <option value="OTHER">OTHER</option>
            </select>
            <input name="transactionRef" placeholder="Reference (optional)" className="erp-input" />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addPayment.isPending}>
              {addPayment.isPending ? "Saving..." : "Post Payment"}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
