/// <reference types="@testing-library/jest-dom" />

// Note: we only need the type augmentations for tsc. The runtime import
// for `@testing-library/jest-dom` is handled by Vitest via `setupFiles` when
// running unit tests. Keeping this file minimal avoids TS errors during build.

// Ensure React is available globally for JSX runtime in tests
import * as React from "react";
// @ts-ignore - expose React to the global scope for tests
(globalThis as any).React = React;

// Import jest-dom matchers
import "@testing-library/jest-dom";
