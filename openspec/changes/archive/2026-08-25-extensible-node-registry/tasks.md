## 1. Registry Store

- [x] 1.1 Rewrite `node-registry/registry.ts` as a store: built-in definitions, `registerNodeDefinitions`, `resetNodeDefinitions`, `listNodeDefinitions`, `getNodeDefinition`, `workflowNodeKinds`, `isNodeKind`, `subscribeNodeDefinitions`.
- [x] 1.2 Widen `NodeKind` to `string` and add `BuiltinNodeKind` for the five shipped kinds.
- [x] 1.3 Make registration idempotent by kind: a repeat registration replaces in place and never appends a duplicate.
- [x] 1.4 Add `registerNodeViews` / `resetNodeViews` / `listNodeViews` to the view registry, notifying the same subscribers.

## 2. Live Reads

- [x] 2.1 Add `useNodeDefinitions` and `useNodeRegistryVersion` on `useSyncExternalStore`.
- [x] 2.2 Read the vocabulary at render in `NodePalette` instead of a module-level snapshot.
- [x] 2.3 Rebuild canvas `nodeTypes` from the live definitions with a memo keyed on the registry version.
- [x] 2.4 Resolve the selected definition in the config panel through `getNodeDefinition`.

## 3. Unregistered Kinds

- [x] 3.1 `getAllowedTargets` / `getNodeOutputPaths` return empty lists for an unregistered kind.
- [x] 3.2 Expression refactoring returns no keys for an unregistered kind.
- [x] 3.3 A config-update command against an unregistered kind fails with `INVALID_NODE_CONFIG_KIND` instead of throwing.
- [x] 3.4 Layout gives an unregistered kind one default output port.
- [x] 3.5 `createInitialGraph` throws a named error for an unregistered kind, since that input is authored.

## 4. Public API

- [x] 4.1 Export `defineNode`, `NodeDefinition`, `NodeCategory`, `OutputHandle`, the registration functions and `useNodeDefinitions` from the package entry point.
- [x] 4.2 Replace `WORKFLOW_NODE_KINDS` with `workflowNodeKinds()` in the entry point and in `workflow/types`.

## 5. Tests

- [x] 5.1 New suite: registration, ordering, idempotent replacement, reset, `isNodeKind`.
- [x] 5.2 A registered kind builds a node, normalizes its config and exposes its connection rules.
- [x] 5.3 The palette renders a registered kind.
- [x] 5.4 An unregistered kind resolves to no rules and is not a valid kind.
- [x] 5.5 Update the existing registry, palette, view-registry, tour and entry-point suites to the accessor API.
