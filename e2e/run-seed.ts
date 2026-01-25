import "dotenv/config";
import { seed } from "./fixtures/db";

(async () => {
  try {
    console.log("Running E2E seed (manual runner)...");
    const out = await seed();
    console.log("Seed finished. Output:");
    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Seed failed with error:");
    if (err instanceof Error) console.error(err.message);
    console.error(err);
    process.exit(1);
  }
})();
