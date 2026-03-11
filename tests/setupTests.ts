// Test setup file for Vitest + Testing Library
import "@testing-library/jest-dom";

// accessibility matcher from axe
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
