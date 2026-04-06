## 1. Node Definition

- [x] 1.1 Create `packages/flow/src/workflow/nodes/logic/result.ts` using `defineNode` with `kind: "result"`, `title: "Result"`, `category: "logic"`, a `select` field (`key: "category"`, `label: "Category"`, options `true`/`false`), empty `outputPaths`, and `buildDefaultConfig` returning `{ category: "true" }`
- [x] 1.2 Choose an appropriate Lucide icon for the Result node (e.g. `CheckCircle`) and import it in `result.ts`

## 2. Registry

- [x] 2.1 Import `result` from `../nodes/logic/result` in `packages/flow/src/workflow/node-registry/registry.ts`
- [x] 2.2 Add `result` to the `allDefinitions` array in `registry.ts`
- [x] 2.3 Check for any exhaustive switches over `NodeKind` in the codebase and add a `result` case where needed

## 3. Tests

- [x] 3.1 Add a test in `packages/flow/src/workflow/node-registry/node-registry.test.ts` verifying `"result"` is present in the registry and has the correct field shape (kind, category, one select field with two options)
