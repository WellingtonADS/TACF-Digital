/**
 * ARCHIVED: QuickActionCard
 * Reason: Arquivado porque não está sendo importado em `src/` e para evitar
 * manter componentes não utilizados no diretório `atomic`.
 * TODO: Remover permanentemente se não houver plano de uso; caso contrário,
 * mover de volta para `atomic/` e atualizar chamadas.
 */

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
