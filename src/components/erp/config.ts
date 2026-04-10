import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  Cog,
  Factory,
  FileText,
  ShieldCheck,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const ERP_NAV: NavItem[] = [
  { href: "/dashboard", label: "Executive Dashboard", icon: BarChart3, group: "Core" },
  { href: "/orders", label: "Sales & Orders", icon: ShoppingCart, group: "Operations" },
  { href: "/inventory", label: "Inventory Control", icon: Boxes, group: "Operations" },
  { href: "/warehouse", label: "Warehouse Ops", icon: Warehouse, group: "Operations" },
  { href: "/finance", label: "Finance & Accounting", icon: CircleDollarSign, group: "Finance" },
  { href: "/crm", label: "Customers & CRM", icon: Users, group: "Commercial" },
  { href: "/procurement", label: "Procurement", icon: Factory, group: "Commercial" },
  { href: "/hr", label: "HR & Workforce", icon: ShieldCheck, group: "People" },
  { href: "/reports", label: "Reporting & BI", icon: FileText, group: "Analytics" },
  { href: "/admin", label: "System Administration", icon: Cog, group: "System" },
];
