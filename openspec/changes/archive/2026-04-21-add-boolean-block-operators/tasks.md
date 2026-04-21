## 1. Runtime contract

- [x] 1.1 Add typed branch operator definitions and default branch operator catalog helpers in shared workflow types/runtime modules.
- [x] 1.2 Extend `WorkflowRuntimeConfig` with `branch.operators` and normalize consumer-provided operator catalogs with default fallback behavior.

## 2. Branch node integration

- [x] 2.1 Refactor the branch boolean node to read operator definitions from the mounted runtime instead of hardcoded operator arrays.
- [x] 2.2 Drive target-value input visibility, new-condition defaults, and missing-operator fallback UI from the active operator metadata.

## 3. Verification

- [x] 3.1 Add tests covering default operator fallback, custom runtime operator catalogs, and `requiresTarget`-driven target-input behavior.
- [x] 3.2 Add regression tests for invalid runtime catalogs and existing branch conditions whose operator id is absent from the active catalog.
