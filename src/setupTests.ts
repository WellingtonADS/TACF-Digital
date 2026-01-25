/// <reference types="@testing-library/jest-dom" />

// Note: we only need the type augmentations for tsc. The runtime import
// for `@testing-library/jest-dom` is handled by Vitest via `setupFiles` when
// running unit tests. Keeping this file minimal avoids TS errors during build.
