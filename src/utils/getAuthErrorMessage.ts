export function getAuthErrorMessage(
  err: unknown,
  defaultMsg = "Erro na autenticação.",
) {
  const raw = err instanceof Error ? err.message : String(err ?? "");
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
  if (msg.includes("password should") || msg.includes("password must"))
    return "Senha fraca: verifique os requisitos de senha.";
  if (
    msg.includes("internal") ||
    msg.includes("network") ||
    msg.includes("timeout")
  )
    return "Erro de servidor. Tente novamente mais tarde.";

  return raw || defaultMsg;
}
