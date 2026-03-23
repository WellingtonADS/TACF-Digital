/**
 * @page NotificationCard
 * @description Card para exibir notificações e alertas.
 * @path src/components/atomic/NotificationCard.tsx
 */

import type { ReactNode } from "react";

type Props = {
  title?: string;
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  children?: ReactNode;
};

export const NotificationCard = ({
  title,
  message,
  variant = "info",
  children,
}: Props) => {
  const base = "p-3 rounded-lg shadow-sm";
  const variants: Record<NonNullable<Props["variant"]>, string> = {
    info: "bg-bg-card",
    success: "bg-success/10",
    warning: "bg-alert/10",
    error: "bg-error/10",
  };

  return (
    <div className={`${base} ${variants[variant]}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm">{message}</div>
      {children}
    </div>
  );
};

export default NotificationCard;
