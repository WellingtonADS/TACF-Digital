import type { ReactNode } from "react";

type Props = { children?: ReactNode; className?: string };

export const Card = ({ children, className = "" }: Props) => (
  <div className={`p-4 bg-white rounded shadow-sm ${className}`}>
    {children}
  </div>
);

export default Card;
