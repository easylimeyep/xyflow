## Context

The current workflow model defines a dedicated `trigger` node kind that is used as the default entry point (`default-graph/default-graph.ts`) and appears in the node registry/palette. `Keyword` is implemented as `inlineExpression` and rendered by a custom component that uses `NodeShell`. `NodeShell` currently renders a plain text title and always shows the target handle unless `showTarget` is explicitly disabled.

Connection validity is centrally enforced in `validation/validation.ts`, while graph mutations are committed through store slices (`connection-slice`, `graph-slice`, `node-config-updates`). This gives us clean extension points for both UI-level and data-level enforcement of root behavior.

## Goals / Non-Goals

**Goals:**
- Add an explicit `Root` toggle to `Keyword` node UI and persist it in node config.
- Make `Root` keyword nodes start-like by removing/hiding input handles.
- Enforce graph rules so root keywords cannot have incoming edges.
- Support multiple root keywords simultaneously.
- Remove `Trigger` from authoring and default graph setup.

**Non-Goals:**
- Backward compatibility migration for legacy workflows containing `trigger`.
- Runtime execution semantics beyond graph authoring constraints.
- Restricting workflow to exactly one root node.

## Decisions

### Decision: Represent root state as `inlineExpression.config.isRoot: boolean`
`Keyword` already stores editable behavior in node config. Adding `isRoot` keeps the feature local to `inlineExpression`, allows import/export normalization through existing config pipelines, and avoids introducing separate graph-level metadata.

Alternative considered: separate graph-level start-node set. Rejected as heavier than needed for this UI-driven behavior.

### Decision: Extend `NodeShell` with a header accessory slot
The checkbox must appear next to the title in-card. Rather than duplicating header markup in each node component, `NodeShell` will accept an optional header accessory element and handle layout once.

Alternative considered: custom standalone header in `InlineExpressionNode`. Rejected to avoid divergence from shared node shell.

### Decision: Enforce root incoming-edge rules in two layers
1. **Preventive**: `validateConnection` rejects connections targeting `inlineExpression` nodes where `isRoot === true`.
2. **Corrective**: when toggling `Root` from false to true, remove already-existing incoming edges to keep persisted graph consistent.

Alternative considered: UI-only prevention via hidden handle. Rejected because programmatic edge insertion/import flows still need data-layer guarantees.

### Decision: Remove `Trigger` completely from active node kinds
`trigger` will be removed from registry/default graph/type unions so the authoring surface reflects the new model directly: start behavior is a mode of `Keyword`, not a separate node type.

Alternative considered: keep `Trigger` as deprecated alias. Rejected per scope and product decision (no migration path needed).

## Risks / Trade-offs

- [Coverage churn] Trigger-centric tests are widespread and will need broad fixture updates. -> Mitigation: update fixtures systematically to use root/non-root keyword nodes and add focused regression tests for new constraints.
- [Behavior drift between UI and store] If only one layer is updated, invalid states can slip in. -> Mitigation: enforce root rules in both `NodeShell` rendering and `validateConnection`/store updates.
- [Breaking import behavior] Legacy payloads with `trigger` will fail parsing/type checks after removal. -> Mitigation: document as explicit breaking change in proposal/spec and do not add silent migration.

## Migration Plan

- Ship as a breaking authoring-model change: new workflows start with a root `Keyword`.
- Do not translate old `trigger` nodes during import.
- Rollback path: restore `trigger` kind in registry/default graph and keep `isRoot` flag ignored.

## Open Questions

- None. Product decisions are fixed for this change: multiple roots are allowed; legacy trigger workflows are not migrated.
