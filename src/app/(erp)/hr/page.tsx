"use client";

import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { KpiCard, SectionCard } from "@/components/erp/cards";
import { apiFetch, apiSend } from "@/components/erp/fetcher";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  department?: string;
};

export default function HrPage() {
  const queryClient = useQueryClient();
  const employees = useQuery({ queryKey: ["employees"], queryFn: () => apiFetch<Employee[]>("/api/employees") });

  const addEmployee = useMutation({
    mutationFn: (payload: unknown) => apiSend("/api/employees", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Employees" value={employees.data?.length ?? 0} />
        <KpiCard title="Active" value={(employees.data ?? []).filter((e) => e.status === "ACTIVE").length} />
        <KpiCard title="On Leave" value={(employees.data ?? []).filter((e) => e.status === "ON_LEAVE").length} />
        <KpiCard title="Inactive" value={(employees.data ?? []).filter((e) => e.status === "INACTIVE").length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Add Employee">
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addEmployee.mutate({
                employeeCode: form.get("employeeCode"),
                name: form.get("name"),
                email: form.get("email") || undefined,
                phone: form.get("phone") || undefined,
                role: form.get("role"),
                department: form.get("department") || undefined,
                status: form.get("status"),
              });
              event.currentTarget.reset();
            }}
          >
            <input name="employeeCode" placeholder="Employee Code" className="erp-input" required />
            <input name="name" placeholder="Name" className="erp-input" required />
            <input name="role" placeholder="Role" className="erp-input" required />
            <input name="department" placeholder="Department" className="erp-input" />
            <input name="email" type="email" placeholder="Email" className="erp-input" />
            <input name="phone" placeholder="Phone" className="erp-input" />
            <select name="status" className="erp-input" defaultValue="ACTIVE">
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON_LEAVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white" type="submit" disabled={addEmployee.isPending}>
              {addEmployee.isPending ? "Creating..." : "Create Employee"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Workforce Directory">
          <div className="grid gap-2 text-sm">
            {(employees.data ?? []).map((e) => (
              <div key={e.id} className="rounded-md bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{e.name}</p>
                <p className="text-xs text-slate-500">{e.employeeCode} • {e.role}</p>
                <p className="mt-1 text-xs text-slate-600">{e.department ?? "No department"} • {e.status}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
