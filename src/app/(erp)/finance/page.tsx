"use client";

import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch, apiSend } from "@/components/erp/fetcher";

type Account = { id: string; code: string; name: string; type: string };
type Journal = { id: string; entryNumber: number; createdAt: string; lines: { id: string }[] };

export default function FinancePage() {
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: () => apiFetch<Account[]>("/api/accounts") });
  const journals = useQuery({ queryKey: ["journals"], queryFn: () => apiFetch<Journal[]>("/api/journal-entries") });

  const addAccount = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/accounts", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const addJournal = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/journal-entries", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Chart Accounts" value={accounts.data?.length ?? 0} />
        <KpiCard title="Journal Entries" value={journals.data?.length ?? 0} />
        <KpiCard title="Recent Entries" value={(journals.data ?? []).slice(0, 7).length} />
        <KpiCard title="Control Status" value="Balanced" hint="Auto validation enabled" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Create Account">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addAccount.mutate({
                code: form.get("code"),
                name: form.get("name"),
                type: form.get("type"),
                description: form.get("description") || undefined,
              });
              event.currentTarget.reset();
            }}
          >
            <input name="code" placeholder="Account Code" className="erp-input" required />
            <input name="name" placeholder="Account Name" className="erp-input" required />
            <select name="type" className="erp-input" defaultValue="ASSET">
              <option value="ASSET">ASSET</option>
              <option value="LIABILITY">LIABILITY</option>
              <option value="EQUITY">EQUITY</option>
              <option value="INCOME">INCOME</option>
              <option value="EXPENSE">EXPENSE</option>
            </select>
            <input name="description" placeholder="Description" className="erp-input" />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addAccount.isPending}>
              {addAccount.isPending ? "Saving..." : "Create Account"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Post Journal Entry">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const amount = Number(form.get("amount") ?? 0);
              addJournal.mutate({
                reference: form.get("reference") || undefined,
                memo: form.get("memo") || undefined,
                lines: [
                  {
                    accountId: form.get("debitAccountId"),
                    debitAmount: amount,
                    creditAmount: 0,
                  },
                  {
                    accountId: form.get("creditAccountId"),
                    debitAmount: 0,
                    creditAmount: amount,
                  },
                ],
              });
              event.currentTarget.reset();
            }}
          >
            <input name="reference" placeholder="Reference" className="erp-input" />
            <input name="memo" placeholder="Memo" className="erp-input" />
            <select name="debitAccountId" className="erp-input" required>
              <option value="">Debit account</option>
              {(accounts.data ?? []).map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
              ))}
            </select>
            <select name="creditAccountId" className="erp-input" required>
              <option value="">Credit account</option>
              {(accounts.data ?? []).map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
              ))}
            </select>
            <input name="amount" type="number" min={0.01} step="0.01" placeholder="Amount" className="erp-input" required />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addJournal.isPending}>
              {addJournal.isPending ? "Posting..." : "Post Journal"}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
