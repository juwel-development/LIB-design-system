// The /vitest entrypoint registers the matchers *and* augments vitest's Assertion interface,
// so `toBeInTheDocument` type-checks as well as running. tsconfig includes this file for that
// augmentation to reach the specs.
import '@testing-library/jest-dom/vitest';
