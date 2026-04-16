## 1. Public API Restructure

- [x] 1.1 Replace the package root `Flow` export with `WorkflowEditor` and update `@workspace/flow` entrypoint types/exports.
- [x] 1.2 Move workflow store provider mounting into the public `WorkflowEditor` root component and support default-vs-custom rendering based on `children`.
- [x] 1.3 Remove the legacy `Flow` implementation and update in-repo imports/usages that rely on it.

## 2. Compound Components

- [x] 2.1 Extract or formalize public editor parts for `Toolbar`, `Body`, `Palette`, `Canvas`, and `ConfigPanel`.
- [x] 2.2 Preserve the current default editor composition using those public parts when `WorkflowEditor` has no children.
- [x] 2.3 Export the same editor parts both as `WorkflowEditor.*` static properties and as named package exports.

## 3. Hooks Namespace

- [x] 3.1 Reuse existing store hooks to expose `WorkflowEditor.use.store`, `WorkflowEditor.use.shallowStore`, and `WorkflowEditor.use.graph`.
- [x] 3.2 Add curated `useWorkflowSelection` and `useWorkflowActions` hooks for the `WorkflowEditor.use` namespace.
- [x] 3.3 Keep the hooks namespace limited to `store`, `shallowStore`, `graph`, `selection`, and `actions`.

## 4. Verification

- [x] 4.1 Update or add tests for default `WorkflowEditor` rendering, custom-children rendering, and mount-scoped runtime behavior.
- [x] 4.2 Add coverage for compound component exports, named exports, and the `WorkflowEditor.use` namespace.
- [x] 4.3 Run package tests and type checks for `@workspace/flow` to confirm the new public API is implementation-ready.
