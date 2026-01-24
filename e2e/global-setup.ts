import { seed } from "./fixtures/db";

export default async () => {
  console.log("Seeding E2E test data...");
  const out = await seed();
  console.log("Seed result:", out);
};
