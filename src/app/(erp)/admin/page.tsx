"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch, apiSend } from "@/components/erp/fetcher";

type Workflow = { id: string; name: string; module: string; triggerType: string; isActive: boolean };
type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  department?: string | null;
};
type Customer = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  phone?: string | null;
};
type Transfer = {
  id: string;
  transferNumber: number;
  status: "DRAFT" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  fromWarehouse: { name: string };
  toWarehouse: { name: string };
};

export default function AdminPage() {
  const queryClient = useQueryClient();

  const workflows = useQuery({ queryKey: ["workflows"], queryFn: () => apiFetch<Workflow[]>("/api/automation/workflows") });
  const employees = useQuery({ queryKey: ["employees"], queryFn: () => apiFetch<Employee[]>("/api/employees") });
  const customers = useQuery({ queryKey: ["customers"], queryFn: () => apiFetch<Customer[]>("/api/customers") });
  const transfers = useQuery({ queryKey: ["transfers"], queryFn: () => apiFetch<Transfer[]>("/api/warehouse/transfers") });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["workflows"] }),
      queryClient.invalidateQueries({ queryKey: ["employees"] }),
      queryClient.invalidateQueries({ queryKey: ["customers"] }),
      queryClient.invalidateQueries({ queryKey: ["transfers"] }),
    ]);
  };

  const updateEmployee = useMutation({
    mutationFn: (payload: { id: string; role?: string; department?: string; status?: Employee["status"] }) =>
      apiSend<Employee>("/api/employees", { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: refreshAll,
  });

  const updateCustomer = useMutation({
    mutationFn: (payload: { id: string; isActive: boolean }) =>
      apiSend<Customer>("/api/customers", { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: refreshAll,
  });

  const updateWorkflow = useMutation({
    mutationFn: (payload: { id: string; isActive: boolean }) =>
      apiSend<Workflow>("/api/automation/workflows", { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: refreshAll,
  });

  const updateTransfer = useMutation({
    mutationFn: (payload: { id: string; status: Transfer["status"] }) =>
      apiSend<Transfer>("/api/warehouse/transfers", { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: refreshAll,
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Users / Workforce" value={employees.data?.length ?? 0} hint="Role + status managed" />
        <KpiCard title="CRM Customers" value={customers.data?.length ?? 0} hint="Active state controlled" />
        <KpiCard title="Workflow Rules" value={workflows.data?.length ?? 0} hint="Automation toggle" />
        <KpiCard title="Operational Transfers" value={transfers.data?.length ?? 0} hint="Status controlled" />
      </div>

      <SectionCard title="User & HR Workforce Control">
        <div className="grid gap-3 text-sm">
          {(employees.data ?? []).map((e) => (
            <div key={e.id} className="rounded-md bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{e.name}</p>
                  <p className="text-xs text-slate-500">{e.employeeCode} • {e.role} • {e.department ?? "No Dept"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={e.status}
                    onChange={(event) =>
                      updateEmployee.mutate({
                        id: e.id,
                        status: event.target.value as Employee["status"],
                      })
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                  <button
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => updateEmployee.mutate({ id: e.id, role: e.role === "Admin" ? "Manager" : "Admin" })}
                  >
                    Toggle Admin Role
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Customers & CRM Control">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          {(customers.data ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
              <div>
                <p className="font-semibold text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500">{c.code} {c.phone ? `• ${c.phone}` : ""}</p>
              </div>
              <button
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
                onClick={() => updateCustomer.mutate({ id: c.id, isActive: !c.isActive })}
              >
                {c.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Operations Control Center">
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Automation Workflows</p>
            {(workflows.data ?? []).map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{w.name}</p>
                  <p className="text-xs text-slate-500">{w.module} • {w.triggerType}</p>
                </div>
                <button
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    w.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                  }`}
                  onClick={() => updateWorkflow.mutate({ id: w.id, isActive: !w.isActive })}
                >
                  {w.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Warehouse Transfer Oversight</p>
            {(transfers.data ?? []).slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">TR-{t.transferNumber}</p>
                  <p className="text-xs text-slate-500">{t.fromWarehouse.name} → {t.toWarehouse.name}</p>
                </div>
                <select
                  defaultValue={t.status}
                  onChange={(event) => updateTransfer.mutate({ id: t.id, status: event.target.value as Transfer["status"] })}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {(updateEmployee.isPending || updateCustomer.isPending || updateWorkflow.isPending || updateTransfer.isPending) ? (
        <p className="text-xs text-slate-500">Saving admin changes...</p>
      ) : null}
    </div>
  );
}
