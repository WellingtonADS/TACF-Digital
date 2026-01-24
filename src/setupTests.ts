// Load jest-dom matchers only when running Vitest to avoid augmenting globals
// during Playwright runs which use a different `expect` implementation.
if (process.env.VITEST) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import("@testing-library/jest-dom");
}
