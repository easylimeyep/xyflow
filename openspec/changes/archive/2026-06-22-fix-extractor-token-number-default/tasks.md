## 1. Default Config

- [x] 1.1 Change Extractor `buildDefaultConfig` so `tokenNumber` defaults to `1` in `definition.ts`.

## 2. Regression Coverage

- [x] 2.1 Add or update a node-registry test asserting extractor `buildDefaultConfig().tokenNumber` is `1`.
- [x] 2.2 Update extractor component tests that create nodes with implicit default expectations if needed.
- [x] 2.3 Update workflow tests/fixtures that expect newly created extractor nodes to store `tokenNumber: 0`.

## 3. Verification

- [x] 3.1 Run extractor-related unit tests in `packages/flow`.
- [x] 3.2 Confirm a freshly added extractor node exports `config.tokenNumber: 1` through backend transform without editing the field.
