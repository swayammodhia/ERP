"use client";

import { useQuery } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch } from "@/components/erp/fetcher";
import { fromMinorUnits } from "@/lib/money";

type Overview = {
  customerCount: number;
  warehouseCount: number;
  transferCount: number;
  employeeCount: number;
  accountCount: number;
  workflowCount: number;
  openInvoices: number;
  outstandingReceivables: number;
};

function money(value: number | string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(fromMinorUnits(value));
}

export default function ReportsPage() {
  const reports = useQuery({ queryKey: ["reports"], queryFn: () => apiFetch<Overview>("/api/reports/overview") });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Customers" value={reports.data?.customerCount ?? 0} />
        <KpiCard title="Transfers" value={reports.data?.transferCount ?? 0} />
        <KpiCard title="Open Invoices" value={reports.data?.openInvoices ?? 0} />
        <KpiCard title="Outstanding" value={money(reports.data?.outstandingReceivables ?? 0)} />
      </div>

      <SectionCard title="Analytics Snapshot">
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <Metric label="Warehouses" value={reports.data?.warehouseCount ?? 0} />
          <Metric label="Employees" value={reports.data?.employeeCount ?? 0} />
          <Metric label="Accounts" value={reports.data?.accountCount ?? 0} />
          <Metric label="Automation Workflows" value={reports.data?.workflowCount ?? 0} />
        </div>
      </SectionCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}
