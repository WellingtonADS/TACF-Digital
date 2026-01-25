import { toast } from "sonner";

export function bookingConfirmed(orderNumber?: string) {
  if (orderNumber) {
    toast.success(
      `Agendamento confirmado. Número de Ordem gerado: ${orderNumber}. Instruções enviadas para seu e-mail.`,
    );
  } else {
    toast.success(
      "Agendamento confirmado. Instruções enviadas para seu e-mail.",
    );
  }
}

export function swapPending() {
  toast(
    "Sua solicitação de alteração foi encaminhada ao Coordenador. Aguarde a validação para novo agendamento.",
  );
}

export function sessionFull() {
  toast.error(
    "Operação não permitida: o limite máximo de 21 militares para este turno foi atingido.",
  );
}

export function seasonalInvalid() {
  toast.error("Data fora da janela sazonal (Fev–Mai, Set–Nov).");
}

export function approvalSuccess() {
  toast.success(
    "Alteração autorizada. O militar foi realocado e o agendamento anterior foi cancelado.",
  );
}

export function genericError(message?: string) {
  toast.error(message ?? "Erro ao processar a operação");
}

export default {
  bookingConfirmed,
  swapPending,
  sessionFull,
  seasonalInvalid,
  approvalSuccess,
  genericError,
};
