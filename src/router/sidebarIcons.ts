import type { LucideIcon } from "@/icons";
import {
  BarChart2,
  Calendar,
  ClipboardList,
  ClipboardPen,
  FileText,
  LayoutDashboard,
  MapPin,
  Settings,
  Shield,
  Ticket,
  User,
  Users,
} from "@/icons";
import type { SidebarIconKey } from "@/types";

export const sidebarIconMap: Record<SidebarIconKey, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  "file-text": FileText,
  ticket: Ticket,
  "clipboard-list": ClipboardList,
  user: User,
  users: Users,
  "map-pin": MapPin,
  "clipboard-pen": ClipboardPen,
  "bar-chart-2": BarChart2,
  settings: Settings,
  shield: Shield,
};
