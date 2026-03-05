export type E2ERole = "user" | "admin";

export type E2ECredentials = {
  email: string;
  password: string;
};

function resolveEnv(primary: string, fallback: string): string | undefined {
  return process.env[primary]?.trim() || process.env[fallback]?.trim();
}

export function hasCredentials(role: E2ERole): boolean {
  if (role === "admin") {
    return Boolean(
      resolveEnv("E2E_ADMIN_EMAIL", "SEED_ADMIN_EMAIL") &&
      resolveEnv("E2E_ADMIN_PASSWORD", "SEED_ADMIN_PASSWORD"),
    );
  }

  return Boolean(
    resolveEnv("E2E_USER_EMAIL", "SEED_USER_EMAIL") &&
    resolveEnv("E2E_USER_PASSWORD", "SEED_USER_PASSWORD"),
  );
}

export function getCredentials(role: E2ERole): E2ECredentials {
  if (role === "admin") {
    const email = resolveEnv("E2E_ADMIN_EMAIL", "SEED_ADMIN_EMAIL");
    const password = resolveEnv("E2E_ADMIN_PASSWORD", "SEED_ADMIN_PASSWORD");
    if (!email || !password) {
      throw new Error(
        "Credenciais admin ausentes: informe E2E_ADMIN_* ou SEED_ADMIN_* no .env.",
      );
    }

    return {
      email,
      password,
    };
  }

  const email = resolveEnv("E2E_USER_EMAIL", "SEED_USER_EMAIL");
  const password = resolveEnv("E2E_USER_PASSWORD", "SEED_USER_PASSWORD");
  if (!email || !password) {
    throw new Error(
      "Credenciais user ausentes: informe E2E_USER_* ou SEED_USER_* no .env.",
    );
  }

  return {
    email,
    password,
  };
}
