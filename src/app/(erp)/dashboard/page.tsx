"use client";

import { useQuery } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch } from "@/components/erp/fetcher";
import { fromMinorUnits } from "@/lib/money";

type Summary = { productCount: number; lowStockCount: number; todaySales: number; pendingInvoices: number };
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
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    fromMinorUnits(value),
  );
}

export default function DashboardPage() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => apiFetch<Summary>("/api/dashboard/summary") });
  const reports = useQuery({ queryKey: ["reports"], queryFn: () => apiFetch<Overview>("/api/reports/overview") });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Today Sales" value={money(summary.data?.todaySales ?? 0)} hint="Live from POS" />
        <KpiCard title="Open Invoices" value={summary.data?.pendingInvoices ?? 0} hint="Action required" />
        <KpiCard title="Low Stock SKUs" value={summary.data?.lowStockCount ?? 0} hint="Reorder planning" />
        <KpiCard title="Active Products" value={summary.data?.productCount ?? 0} hint="Catalog size" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Operational Health">
          <div className="grid gap-3 sm:grid-cols-2">
            <Mini title="Customers" value={reports.data?.customerCount ?? 0} />
            <Mini title="Warehouses" value={reports.data?.warehouseCount ?? 0} />
            <Mini title="Transfers" value={reports.data?.transferCount ?? 0} />
            <Mini title="Employees" value={reports.data?.employeeCount ?? 0} />
            <Mini title="Accounts" value={reports.data?.accountCount ?? 0} />
            <Mini title="Outstanding" value={money(reports.data?.outstandingReceivables ?? 0)} />
          </div>
        </SectionCard>
        <SectionCard title="Executive Notes">
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="rounded-md bg-slate-50 p-3">Use low-stock panel for proactive replenishment.</li>
            <li className="rounded-md bg-slate-50 p-3">Track unpaid invoices and payment aging daily.</li>
            <li className="rounded-md bg-slate-50 p-3">Review warehouse transfers to keep stock balanced.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function Mini({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
