import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
};

export const SidebarItem = ({ icon, label, to, onClick }: Props) => {
  const Tag = to ? "a" : ("button" as const);

  return (
    <Tag
      href={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 rounded hover:bg-slate-100"
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span>{label}</span>
    </Tag>
  );
};

export default SidebarItem;
