## 1. Runtime import API

- [x] 1.1 Extend `WorkflowRuntimeConfig` with typed `importDomain` mapper support that mirrors the existing export-domain contract.
- [x] 1.2 Refactor parser utilities so import flow can obtain a validated `DomainWorkflowDTO` before internal graph conversion.

## 2. Import pipeline integration

- [x] 2.1 Update `importFromJson` to apply the optional runtime import mapper before `domainToInternal`, with schema validation of mapper output.
- [x] 2.2 Preserve existing graph normalization steps after conversion, including label deduplication and variable-reference refactors.

## 3. Verification

- [x] 3.1 Add store-level tests covering JSON import with no runtime mapper, with a transforming runtime mapper, and with invalid mapper output.
- [x] 3.2 Add public runtime API coverage confirming the import mapper is exposed through the mount-scoped `WorkflowEditor` runtime contract.
