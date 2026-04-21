type Credentials = {
  email: string;
  password: string;
};

function requireCredential(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável obrigatória ausente para E2E: ${name}`);
  }
  return value;
}

function resolveCredentialPair(
  emailKey: string,
  passwordKey: string,
  fallbackEmailKey: string,
  fallbackPasswordKey: string,
): Credentials {
  const email = process.env[emailKey] || process.env[fallbackEmailKey];
  const password =
    process.env[passwordKey] || process.env[fallbackPasswordKey];

  if (!email || !password) {
    throw new Error(
      `Credenciais E2E ausentes: configure ${emailKey}/${passwordKey} ou ${fallbackEmailKey}/${fallbackPasswordKey}.`,
    );
  }

  return { email, password };
}

export const adminCredentials = resolveCredentialPair(
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "SEED_ADMIN_EMAIL",
  "SEED_ADMIN_PASSWORD",
);

export const userCredentials = resolveCredentialPair(
  "E2E_USER_EMAIL",
  "E2E_USER_PASSWORD",
  "SEED_USER_EMAIL",
  "SEED_USER_PASSWORD",
);

export const coordinatorCredentials = resolveCredentialPair(
  "E2E_COORD_EMAIL",
  "E2E_COORD_PASSWORD",
  "SEED_COORD_EMAIL",
  "SEED_COORD_PASSWORD",
);

export const databaseUrl = requireCredential("DATABASE_URL");
