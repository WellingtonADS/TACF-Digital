/**
 * @page Card
 * @description Cartão reutilizável com elevação e estados.
 * @path src/components/atomic/Card.tsx
 */



import type { ReactNode } from "react";

type Props = { children?: ReactNode; className?: string };

export const CARD_BASE_CLASS = "card-surface rounded shadow-sm";
export const CARD_ELEVATED_CLASS = "card-surface-elevated rounded";
export const CARD_INTERACTIVE_CLASS = "card-surface-interactive rounded";

export const Card = ({ children, className = "" }: Props) => (
  <div className={`p-4 ${CARD_BASE_CLASS} ${className}`}>{children}</div>
);

export default Card;
