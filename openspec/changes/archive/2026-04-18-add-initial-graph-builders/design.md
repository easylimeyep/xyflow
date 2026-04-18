## Context

`WorkflowEditor` already accepts a fully-formed `initialGraph`, but the current authoring experience is too low-level for examples and reusable presets. Consumers must manually provide `position`, `width`, and edge `data` even though the flow package already knows node defaults through the node registry, default dimensions through the node factory, and layout semantics through the workflow ELK adapter.

This change is cross-cutting because it touches package exports, workflow graph normalization, layout orchestration, and example usage. The public API also needs to balance two different ergonomics:
- a synchronous path that is easy to use in docs and constant declarations
- an asynchronous path that can reuse the existing ELK auto-layout pipeline without duplicating logic

The current architecture gives us the right ingredients:
- node definitions are the source of truth for default titles, default config, and output handle ordering
- `computeWorkflowAutoLayout()` already converts a `WorkflowGraphState` into ELK input and returns positioned nodes
- `WorkflowEditor` already accepts a normalized `WorkflowGraphState`, so we can improve authoring without changing editor runtime semantics

## Goals / Non-Goals

**Goals:**
- Add a compact initial-graph input contract that lets consumers describe semantic workflow data without manual sizes or coordinates.
- Provide a synchronous builder for deterministic `linear` layout.
- Provide an asynchronous builder that reuses the existing ELK auto-layout pipeline for initial graph placement.
- Normalize node defaults, edge metadata, document defaults, and viewport defaults in one place.
- Keep `WorkflowEditor` and `WorkflowStoreInitialProps` unchanged so existing consumers are not broken.

**Non-Goals:**
- Change `WorkflowEditor` to accept partial or lazy graph input directly.
- Auto-run ELK on editor mount when a consumer passes a compact graph description.
- Introduce a new layout engine or fork ELK translation logic.
- Expose full layout-configuration knobs as public API in the first version.
- Replace the existing manual auto-layout action in the canvas.

## Decisions

### Decision: Add dedicated builder utilities instead of changing `WorkflowEditor` input shape

The change should introduce new public builder utilities that return `WorkflowGraphState` rather than broadening `WorkflowEditor` to accept compact graph input directly.

Why this approach:
- It preserves the current editor contract and avoids hidden normalization during mount.
- It keeps graph construction deterministic and testable outside of React rendering.
- It lets docs, tests, and consumers build graphs once and pass plain data into the editor.

Alternatives considered:
- Let `WorkflowEditor` accept a union of `WorkflowGraphState | InitialGraphInput`: rejected because it hides async/layout work behind mount-time behavior and complicates the public prop contract.
- Accept compact input and auto-layout on first render: rejected because it mixes authoring concerns with runtime editor state and conflicts with the current manual-only layout semantics.

### Decision: Expose two entrypoints: sync linear builder and async ELK builder

The API should use two functions, one synchronous and one asynchronous, rather than a single builder that is sometimes sync and sometimes async based on options.

Proposed shape:
- `createInitialGraph(input): WorkflowGraphState`
- `createInitialGraphElk(input): Promise<WorkflowGraphState>`

Why this approach:
- It keeps the common docs/example path ergonomic and free from unnecessary `await`.
- It makes ELK's async nature explicit in the type system.
- It avoids an options-based API where consumers must remember whether a chosen mode changes call semantics.

Alternatives considered:
- One builder with `layout: "linear" | "elk"`: workable, but awkward because call sites become conditionally async.
- One always-async builder: rejected because it makes the simple linear preset case heavier for no runtime benefit.

### Decision: Use a compact semantic input type and normalize into `WorkflowGraphState`

The builder should accept nodes and edges that describe workflow meaning, not editor rendering details.

Input principles:
- Nodes declare `id`, `kind`, optional `label`, and optional partial `config`
- Edges declare endpoints and optional handle ids
- Consumers do not provide `type`, `width`, `position`, or edge `data`

Normalization behavior:
- Merge user `config` over `buildDefaultConfig()` from the node definition
- Use node definition title when `label` is omitted
- Derive `type` from `kind`
- Fill edge `data.sourceKind` and `data.targetKind` from referenced nodes
- Provide default document and viewport values when omitted

Why this approach:
- It removes duplicated knowledge from examples and consuming apps.
- It keeps node defaults aligned with the registry contract.
- It makes initial graph creation resilient to future config default changes.

Alternatives considered:
- Require complete `config` for every node: rejected because it would preserve too much authoring noise.
- Reuse `createWorkflowNode()` directly for all nodes: partially useful, but insufficient because it requires positions up front and does not cover edge/document normalization.

### Decision: Reuse registry and layout-port metadata as the single source of truth for both layout modes

Both builders should read from the existing node registry and layout-port helpers instead of hardcoding branch or result behavior.

Why this approach:
- `resolveWorkflowLayoutPorts()` already defines whether a node has an input port and what output handles it exposes.
- Branch handle ordering is already declared in the node definition and should not be duplicated in a separate linear-layout rule set.
- Reusing the same metadata keeps linear and ELK modes semantically aligned.

Alternatives considered:
- Encode branch-specific layout rules manually in the builder: rejected because it would drift from the node API v2 source of truth.

### Decision: Implement linear layout as a deterministic DAG layering pass

The synchronous builder should produce stable, readable left-to-right coordinates using a small deterministic layering algorithm.

Expected behavior:
- Treat the normalized graph as a DAG and assign nodes to horizontal layers
- Use fixed column and row gaps aligned with current editor spacing expectations
- Preserve stable vertical ordering within a layer using incoming edge grouping, handle ordering, and original input order
- Respect handle ordering from registry metadata so branch `true` remains above `false`

Why this approach:
- It produces far better defaults than naive index-based placement while remaining synchronous and easy to test.
- It is suitable for docs, examples, and preset graphs where determinism matters more than perfect crossing minimization.

Alternatives considered:
- Simple sequential chain placement only: rejected because it breaks down quickly for branches and multi-root graphs.
- Reimplement a more advanced graph layout engine synchronously: rejected as unnecessary complexity because ELK already covers the high-quality async path.

### Decision: Implement ELK builder as a thin wrapper around `computeWorkflowAutoLayout()`

The ELK builder should normalize input into `WorkflowGraphState` and then call the existing workflow ELK layout helper.

Why this approach:
- It keeps one ELK translation path for both the editor auto-layout action and initial graph creation.
- It avoids duplicating ELK graph construction, handle mapping, and dimension fallback logic.
- It ensures future ELK tuning benefits both runtime layout and initial graph presets automatically.

Alternatives considered:
- Build a second ELK adapter specialized for presets: rejected because it would split behavior and duplicate tests.

## Risks / Trade-offs

- [Risk] Linear layout may not match ELK placement quality on larger or branch-heavy graphs. → Mitigation: keep the sync builder deterministic and good-enough for presets, while offering ELK as the high-fidelity path.
- [Risk] Compact input plus partial config merging could hide missing required semantics if a default is surprising. → Mitigation: derive defaults only from node definitions and add targeted tests for each supported node kind.
- [Risk] Package-root export growth can make the public API noisier. → Mitigation: expose only the two curated builder functions and their input types, not internal normalization helpers.
- [Risk] Document and viewport defaults may not perfectly frame every generated graph. → Mitigation: keep sane defaults for v1 and let consumers override document/viewport fields explicitly when needed.

## Migration Plan

1. Add the new initial-graph builder module under `packages/flow/src/workflow/`.
2. Implement normalization helpers shared by both the linear and ELK builder paths.
3. Implement deterministic linear layout and wire the ELK builder through `computeWorkflowAutoLayout()`.
4. Export the new builders from the package root and add focused tests for normalization and both layout modes.
5. Update the demo page to use the builder API instead of a hand-authored `initialGraph`.

Rollback strategy:
- Remove the new package exports and builder module.
- Revert example usage back to manually authored graph objects.
- No persisted data migration is required because the change only affects how initial graph objects are constructed.

## Open Questions

- Should the initial release export the compact input types publicly, or keep them inferred from function signatures?
- Do we want a public way to customize linear spacing constants in a future version, or should they remain internal until real consumer pressure appears?
- Should the ELK builder preserve a user-supplied viewport untouched when provided, or always prefer a normalized default unless the caller overrides after build?
