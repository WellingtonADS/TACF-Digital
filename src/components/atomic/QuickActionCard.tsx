import type { ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode;
  onClick?: () => void;
};

export const QuickActionCard = ({ title, children, onClick }: Props) => {
  return (
    <div
      className="p-4 rounded-lg bg-white shadow-sm card-flat"
      onClick={onClick}
    >
      <h3 className="font-semibold mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
};

export default QuickActionCard;
