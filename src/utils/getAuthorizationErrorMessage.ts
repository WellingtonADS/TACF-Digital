type ErrorWithCode = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function extractMessageParts(error: unknown): { code: string; text: string } {
  if (!error) return { code: "", text: "" };

  if (typeof error === "string") {
    return { code: "", text: error.toLowerCase() };
  }

  if (error instanceof Error) {
    return { code: "", text: (error.message || "").toLowerCase() };
  }

  const candidate = error as ErrorWithCode;
  const code = (candidate.code || "").toLowerCase();
  const text = [candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return { code, text };
}

export function getAuthorizationErrorMessage(
  error: unknown,
  actionContext = "executar esta ação",
): string | null {
  const { code, text } = extractMessageParts(error);

  const isAuthzError =
    code === "42501" ||
    code === "403" ||
    text.includes("not_authorized") ||
    text.includes("not authorized") ||
    text.includes("permission denied") ||
    text.includes("insufficient_privilege") ||
    text.includes("row-level security") ||
    text.includes("row level security") ||
    text.includes("rls") ||
    text.includes("forbidden");

  if (!isAuthzError) {
    return null;
  }

  return `Acesso negado: você não tem permissão para ${actionContext}.`;
}
