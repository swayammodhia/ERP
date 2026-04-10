"use client";

import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch, apiSend } from "@/components/erp/fetcher";
import { fromMinorUnits } from "@/lib/money";

type Customer = { id: string; code: string; name: string; phone?: string; email?: string; creditLimit: number; isActive?: boolean };

function money(value: number | string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(fromMinorUnits(value));
}

export default function CrmPage() {
  const queryClient = useQueryClient();
  const customers = useQuery({ queryKey: ["customers"], queryFn: () => apiFetch<Customer[]>("/api/customers") });

  const addCustomer = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/customers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const totalCredit = (customers.data ?? []).reduce((sum, c) => sum + Number(c.creditLimit), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Customer Accounts" value={customers.data?.length ?? 0} />
        <KpiCard title="Credit Exposure" value={money(totalCredit)} />
        <KpiCard title="With Phone" value={(customers.data ?? []).filter((c) => !!c.phone).length} />
        <KpiCard title="With Email" value={(customers.data ?? []).filter((c) => !!c.email).length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Add Customer">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addCustomer.mutate({
                code: form.get("code"),
                name: form.get("name"),
                phone: form.get("phone") || undefined,
                email: form.get("email") || undefined,
                address: form.get("address") || undefined,
                creditLimit: Number(form.get("creditLimit") ?? 0),
              });
              event.currentTarget.reset();
            }}
          >
            <input name="code" placeholder="Customer Code" className="erp-input" required />
            <input name="name" placeholder="Customer Name" className="erp-input" required />
            <input name="phone" placeholder="Phone" className="erp-input" />
            <input name="email" type="email" placeholder="Email" className="erp-input" />
            <input name="address" placeholder="Address" className="erp-input" />
            <input name="creditLimit" type="number" min={0} step="0.01" defaultValue={0} className="erp-input" required />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addCustomer.isPending}>
              {addCustomer.isPending ? "Creating..." : "Create Customer"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Customer Register">
          <div className="grid gap-2 text-sm">
            {(customers.data ?? []).map((c) => (
              <div key={c.id} className="rounded-md bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500">{c.code}</p>
                <p className="mt-1 text-xs text-slate-600">Credit: {money(c.creditLimit)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
