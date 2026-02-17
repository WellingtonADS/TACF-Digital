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

  return (
    <div className={`${base} bg-white`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm">{message}</div>
      {children}
    </div>
  );
};

export default NotificationCard;
