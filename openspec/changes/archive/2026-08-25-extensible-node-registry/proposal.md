## Why

The editor's node vocabulary is closed. `registry.ts` builds `nodeRegistry` from a module-level
array of the five definitions this package ships, and `NodeKind` is derived from that array as a
union, so every store command, mapper, validation and layout signature rejects an unknown kind at
the type level. `defineNode` is not even exported from the package entry point.

A consuming product with its own vocabulary therefore has no way in. It can only fork the package or
add its node kinds inside it — which puts a domain vocabulary in a repository that knows nothing
about that domain, and splits the definitions from the schemas they should be derived from.

Everything else needed is already in place: `buildNodeTypes` accepts definitions and falls back to
`DefaultNodeRenderer`, which draws any definition from its `fields`; `NodeShell` renders runtime
status for "kinds registered by consumers" per `2026-08-24-workflow-runtime-observation`. Only the
registry itself is closed.

## What Changes

- Add `registerNodeDefinitions(definitions)` — a consumer adds kinds to the live vocabulary.
  Re-registering a kind replaces it, so strict mode and hot reload do not duplicate palette entries.
- Add `registerNodeViews(map)` for the optional case of a bespoke renderer; a kind without one keeps
  the generic renderer.
- Widen `NodeKind` from the closed union to `string`. Kind validity becomes a runtime question that
  `isNodeKind` answers against the live registry. `BuiltinNodeKind` keeps the union for the five
  built-ins, where a kind-specific type is still meaningful.
- Replace the `nodeRegistry` object and the `WORKFLOW_NODE_KINDS` constant with `getNodeDefinition`,
  `listNodeDefinitions` and `workflowNodeKinds()` — a snapshot constant cannot describe a vocabulary
  that changes at start-up.
- Read the vocabulary at render time in the palette, the config panel and the canvas node types,
  through `useNodeDefinitions` (a `useSyncExternalStore` subscription), so a canvas that mounted
  before registration still picks up the new kinds.
- Resolve an unregistered kind to "no rules" rather than a crash: a stored graph may carry a kind
  the consumer has not registered, and the canvas must still render it.
- Export `defineNode`, `NodeDefinition`, `NodeCategory` and `OutputHandle` from the package entry
  point, so definitions can be authored outside this repository.

## Capabilities

### New Capabilities
- `extensible-node-registry`: register node kinds and their optional renderers from outside the
  package, with the palette, config panel, node factory, config normalization, graph rules and
  canvas all resolving against the live vocabulary.

### Modified Capabilities
- `store-extensible-node-config`: behaviour metadata is now read from definitions that may come from
  a consumer; expression and rename handling stays behaviour-driven with no kind-specific branching.

## Impact

- Affected code: `workflow/node-registry/**`, `workflow/components/{node-palette,node-config-panel,workflow-canvas}`,
  `workflow/{graph-engine,expression/refactor,layout,initial-graph}`, `workflow/types/types.ts`, package entry point.
- Breaking API: `nodeRegistry` and `WORKFLOW_NODE_KINDS` are removed in favour of the accessor
  functions. `getNodeDefinition` now returns `NodeDefinition | undefined`. No app in this repository
  used any of them; the flow package and its tests were the only consumers.
- Behaviour with no registration: identical. The built-in five are the vocabulary until a consumer
  adds to it.
- Persistence: unchanged. `kind` was already a plain `string` in `BaseWorkflowNodeData` and in every
  DTO, so no stored document changes shape.
- Testing: a new suite covering registration, replacement, reset, node creation, config
  normalization, graph rules, palette rendering and the unregistered-kind path.

## Non-goals

- No per-editor-instance vocabulary. Registration is process-wide, which is what the non-React
  layers (mappers, validation, layout) can read. Two editors with different vocabularies in one
  application are out of scope.
- No config-schema validation inside the package. A consumer's config shape is checked by
  `validateConfigValue` on its own definition, as it already is for the built-ins.
- No change to cycle handling, DTO shape, or the runtime observation overlay.
