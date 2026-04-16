## Context

`packages/flow` currently exposes a `Flow` wrapper that mounts `WorkflowStoreProvider` and renders a fixed `WorkflowEditor` implementation. Internally, the editor already contains composition boundaries such as toolbar, palette, and canvas containers, but they are hidden behind a single opinionated render path. The user wants a compound-pattern API that preserves the existing out-of-the-box editor while allowing consumers to assemble custom layouts and still use the same store instance.

This change affects the public API surface of `@workspace/flow`, component composition boundaries, and test coverage around mount-time runtime initialization. It also intersects with the existing `workflow-runtime-context` contract because the public root component used to initialize the store is changing.

## Goals / Non-Goals

**Goals:**
- Make `WorkflowEditor` the public root entrypoint for the flow package.
- Support two root behaviors: default editor composition with no `children`, and provider-only composition when `children` are supplied.
- Expose a small, stable compound API for composing editor UI from reusable parts.
- Expose a compact hooks namespace on `WorkflowEditor.use` for the most common store access patterns.
- Preserve the existing default editing experience and mount-scoped runtime behavior.

**Non-Goals:**
- Redesign editor visuals or interaction behavior beyond the required structural moves.
- Introduce render props, slot APIs, or canvas overlay customization in this change.
- Publish every internal selector or helper as part of the public API.
- Preserve `Flow` as a compatibility alias.

## Decisions

### 1. `WorkflowEditor` becomes the public root component

`WorkflowEditor` will absorb the responsibility currently split between `Flow` and `WorkflowStoreProvider`: it will initialize the store using `initialGraph` and `runtime`, then render either the default editor shell or custom children.

Why:
- Matches the desired mental model: one root editor component with attached parts.
- Removes the current extra indirection where `Flow` is only a thin wrapper.
- Keeps runtime initialization and composition in one public surface.

Alternative considered:
- Keep `Flow` and add `WorkflowEditor.Root`. Rejected because it preserves duplicate entrypoints and weakens the compound API.

### 2. Root rendering mode is selected by `children`

If `WorkflowEditor` receives no `children`, it renders the default composition:

`Toolbar -> Body(Palette + Canvas + ConfigPanel)`

If `children` are present, `WorkflowEditor` renders them verbatim inside the mounted store provider.

Why:
- Gives fast-start DX and advanced composition without introducing separate `Default`, `Root`, or `Provider` components.
- Keeps the public contract compact.

Alternative considered:
- Add explicit `mode` props or separate components for default/custom composition. Rejected because it adds API surface without meaningful behavioral benefit.

### 3. Expose a minimal compound component set

The initial public compound parts will be:
- `WorkflowEditor.Toolbar`
- `WorkflowEditor.Body`
- `WorkflowEditor.Palette`
- `WorkflowEditor.Canvas`
- `WorkflowEditor.ConfigPanel`

These same parts will also be exported as named exports.

Why:
- Covers the existing editor structure with enough flexibility for custom UI assembly.
- Avoids publishing low-level internal containers or layout helpers that are likely to churn.

Alternative considered:
- Publish more granular pieces like canvas overlays or internal toolbar buttons. Rejected because they are implementation details and would lock in unstable boundaries.

### 4. `WorkflowEditor.use` exposes a small curated hook namespace

The root component will attach:
- `WorkflowEditor.use.store`
- `WorkflowEditor.use.shallowStore`
- `WorkflowEditor.use.graph`
- `WorkflowEditor.use.selection`
- `WorkflowEditor.use.actions`

`store`, `shallowStore`, and `graph` reuse existing hooks. `selection` and `actions` provide curated access patterns for custom UI composition without forcing every consumer to derive them from raw store state.

Why:
- Gives advanced consumers an escape hatch without flooding the public API.
- Encourages a more stable API than exporting dozens of selectors.

Alternative considered:
- Expose only raw store hooks. Rejected because consumers would repeatedly rebuild the same UI-level selectors and action bundles.

### 5. Remove `Flow` instead of preserving a compatibility alias

The legacy `Flow` export will be deleted in this change.

Why:
- The user explicitly does not need a soft deprecation path.
- Avoids carrying two public entrypoints for the same concept.

Alternative considered:
- Keep `Flow = WorkflowEditor`. Rejected to avoid ambiguous docs and long-tail compatibility baggage.

## Risks / Trade-offs

- [Breaking import surface] Existing consumers importing `Flow` will fail until migrated. → Mitigation: update package exports, tests, and any in-repo call sites together in one change.
- [Compound parts may accidentally leak layout assumptions] Public parts can be composed in unsupported layouts. → Mitigation: document that custom layout responsibility belongs to the consumer and keep each part focused on behavior, not global layout guarantees.
- [Public hooks can become sticky] Once exported, hook names are harder to change. → Mitigation: keep the initial `WorkflowEditor.use` namespace intentionally small and avoid exporting low-level selectors there.
- [Config panel boundary may require cleanup] If current config panel integration is more implicit than toolbar/palette/canvas, extracting it could expose internal coupling. → Mitigation: perform a small internal controller split before publishing the component.

## Migration Plan

1. Replace the package root export from `Flow` to `WorkflowEditor`.
2. Move store-provider mounting into the public `WorkflowEditor` root implementation.
3. Extract or formalize the public compound parts and named exports.
4. Update tests and in-repo usages to mount through `WorkflowEditor`.
5. Verify default composition still matches the current editor behavior.

Rollback strategy:
- Restore `Flow` as the package root export and keep compound pieces internal if the public API proves too disruptive during implementation.

## Open Questions

- None. The desired root behavior, default composition, component set, and hook namespace were clarified during exploration.
