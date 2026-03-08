import type { ReactNode } from "react";

type Props = { children?: ReactNode; className?: string };

export const Card = ({ children, className = "" }: Props) => (
  <div
    className={`p-4 bg-bg-card rounded shadow-sm border border-border-default ${className}`}
  >
    {children}
  </div>
);

export default Card;
