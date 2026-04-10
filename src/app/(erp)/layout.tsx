import { AppShell } from "@/components/erp/app-shell";

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
