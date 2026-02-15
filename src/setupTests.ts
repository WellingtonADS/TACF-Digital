// Import jest-dom matchers (also provides types for TS)
import "@testing-library/jest-dom";

// Ensure React is available globally for JSX runtime in tests
import * as React from "react";
// Expose React to the global scope for tests (typed safely)
(globalThis as unknown as { React?: typeof React }).React = React;
