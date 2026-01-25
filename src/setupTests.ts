// Load jest-dom matchers only when running Vitest to avoid augmenting globals
// during Playwright runs which use a different `expect` implementation.
if (process.env.VITEST) {
   
  import("@testing-library/jest-dom");
}
