export type SessionClosureChecklistLike = {
  bookings_total: number;
  results_pending: number;
  pending_swap_requests: number;
  can_close: boolean;
  already_completed: boolean;
};

export function getSessionClosureBlockers(
  checklist: SessionClosureChecklistLike | null | undefined,
): string[] {
  if (!checklist) {
    return ["Checklist de encerramento indisponível."];
  }

  if (checklist.already_completed) {
    return ["A sessão já foi encerrada."];
  }

  const blockers: string[] = [];

  if (checklist.bookings_total === 0) {
    blockers.push("A sessão não possui agendamentos ativos.");
  }

  if (checklist.results_pending > 0) {
    blockers.push(
      `${checklist.results_pending} resultado(s) ainda precisam ser lançados.`,
    );
  }

  if (checklist.pending_swap_requests > 0) {
    blockers.push(
      `${checklist.pending_swap_requests} solicitação(ões) de reagendamento seguem pendentes.`,
    );
  }

  return blockers;
}

export function getSessionClosureFailureMessage(
  checklist: SessionClosureChecklistLike | null | undefined,
): string {
  const blockers = getSessionClosureBlockers(checklist);

  if (blockers.length === 0) {
    return "Checklist incompleto para encerramento.";
  }

  return blockers.join(" ");
}
