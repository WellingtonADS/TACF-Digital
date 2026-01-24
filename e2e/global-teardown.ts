import { teardown } from "./fixtures/db";

export default async function globalTeardown() {
  try {
    console.log("Global teardown: removing seeded test data...");
    await teardown();
    console.log("Global teardown complete.");
  } catch (err) {
    console.error("Global teardown failed:", err);
  }
}
