export type SeedUserCredentials = {
  email: string;
  password: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente para E2E: ${name}`);
  }
  return value;
}

export const adminCredentials: SeedUserCredentials = {
  email: requireEnv("SEED_ADMIN_EMAIL"),
  password: requireEnv("SEED_ADMIN_PASSWORD"),
};

export const userCredentials: SeedUserCredentials = {
  email: requireEnv("SEED_USER_EMAIL"),
  password: requireEnv("SEED_USER_PASSWORD"),
};

export const coordinatorCredentials: SeedUserCredentials = {
  email: requireEnv("SEED_COORD_EMAIL"),
  password: requireEnv("SEED_COORD_PASSWORD"),
};
