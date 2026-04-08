export function getAuthErrorMessage(
  err: unknown,
  defaultMsg = "Erro na autenticação.",
) {
  // Supabase AuthApiError pode ter .message, .code ou .error_description
  const errObj = err as Record<string, unknown> | null | undefined;
  const raw =
    (errObj?.message as string) ||
    (errObj?.error_description as string) ||
    (errObj?.msg as string) ||
    (err instanceof Error ? err.message : String(err ?? ""));
  const msg = (raw || "").toLowerCase();

  if (!msg) return defaultMsg;
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid password") ||
    msg.includes("invalid login")
  )
    return "E-mail ou senha inválidos.";
  if (
    msg.includes("user not found") ||
    msg.includes("no user") ||
    msg.includes("not found")
  )
    return "Usuário não existe.";
  if (
    msg.includes("already registered") ||
    msg.includes("user already registered") ||
    msg.includes("duplicate")
  )
    return "E-mail já cadastrado.";
  if (
    msg.includes("email_not_confirmed") ||
    msg.includes("email not confirmed")
  ) {
    return "E-mail não confirmado. Verifique sua caixa de entrada ou peça um novo link de confirmação.";
  }
  if (msg.includes("password should") || msg.includes("password must"))
    return "Senha fraca: verifique os requisitos de senha.";
  if (
    msg.includes("internal") ||
    msg.includes("network") ||
    msg.includes("timeout")
  )
    return "Erro de servidor. Tente novamente mais tarde.";

  if (
    msg.includes("error sending recovery email") ||
    msg.includes("unexpected_failure") ||
    msg.includes("sending recovery") ||
    msg.includes("email not sent") ||
    (errObj?.status === 500 && msg.includes("email")) ||
    ((errObj?.status as number) === 500 && msg === "")
  ) {
    return "Não foi possível enviar o e-mail de recuperação. Configure o SMTP no painel do Supabase ou aguarde alguns minutos e tente novamente.";
  }

  return raw || defaultMsg;
}
