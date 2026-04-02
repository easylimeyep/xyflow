## Context

The workflow store (`packages/flow/src/workflow/store/`) is a Zustand context store composed of six slices and ~2000 lines of helpers. Three structural problems have emerged:

1. **Correctness**: `selectors.ts` holds two module-level mutable variables (`cachedExpressionStructuralSignature`, `expressionCatalogByNodeId`) that are shared across all store instances in a JS module. This causes cross-test contamination, SSR leakage, and subtle stale-cache bugs.
2. **Coupling**: Three slice files import directly from `workflow/expression/refactor/`, a different domain. Graph mutations are implicitly dependent on expression refactoring logic, which makes slices harder to test in isolation.
3. **Maintainability**: `graph-slice.ts` is 419 lines (10 unrelated commands), `onNodesChange` is 95 lines of mixed concerns, `pasteFromClipboard` is 138 lines, and the same label-uniqueness loop is written twice. `naming.ts` has two functions that are identical except for a separator character.

The shared store package (`packages/store/`) is clean and well-designed; this refactor does not touch it.

## Goals / Non-Goals

**Goals:**
- Eliminate module-level mutable state from `selectors.ts`
- Decouple graph slices from the expression domain via a coordination file
- Reduce `graph-slice.ts` to < 200 lines by splitting into focused sub-slices
- Remove all duplicated logic (undo/redo, selection, label uniqueness, naming utilities)
- Replace hardcoded `setVariable` kind checks with extensible `NodeDefinition` fields
- Name all magic numbers in `geometry.ts` as exported constants
- Consolidate noisy store subscriptions in two component files

**Non-Goals:**
- Changing public store API or hook signatures
- Modifying `packages/store/` (history utilities, context-store factory)
- Changing user-visible behavior in any way
- Performance optimisation beyond fixing the selector cache anti-pattern
- Adding new features to the node system

## Decisions

### 1. Move expression cache into Zustand state, not a selector library

**Decision**: Add `expressionCatalogCache: Map<string, ExpressionVariableOption[]>` to `WorkflowStoreQueries`. Reset it to `new Map()` inside `buildExpressionSlicePatch` when the structural signature changes. `selectExpressionVariablesForNode` reads from the map and computes inline on cache miss (without writing back, since selectors are read-only). Component-level caching is an acceptable future addition via `useMemo`.

**Alternatives considered**:
- *reselect / proxy-memoize*: Adds an external dependency and requires changes to every consumer. The existing structural-signature gate already prevents most recomputation — the per-node cache is a secondary concern.
- *Keep module-level cache but reset on store creation*: Would require a factory-level side-effect, which is error-prone and still doesn't fix SSR isolation.

**Why this approach**: Zero new dependencies. The cache reset is co-located with the condition that makes it stale (`buildExpressionSlicePatch`), so it cannot drift. Selectors remain pure read-only functions.

---

### 2. Coordination file instead of event-based decoupling

**Decision**: Create `store/graph-refactors.ts` that simply re-exports `refactorNodeReferencesInGraph` and `refactorVariableReferencesInGraph` from `workflow/expression/refactor/`. Graph slices import from this file instead of directly from the expression domain.

**Alternatives considered**:
- *Event emitter / subscriber pattern*: Proper domain isolation, but is a large architectural investment and adds indirection for no immediate benefit in a single-package codebase.
- *Move refactor logic into store*: Violates the expression domain's cohesion — refactor.ts handles template parsing, not just graph mutations.

**Why this approach**: Creates a clear seam with one import to change if the architecture evolves. The coupling still exists, but it is explicit and localised to a single coordination file rather than spread across three slice files.

---

### 3. Split graph-slice by command group, not by data type

**Decision**: Create three new slices:
- `node-crud-slice.ts`: `addNode`, `updateNodeLabel`, `updateNodeConfig`, `isSetVariableNameUnique`
- `connection-slice.ts`: `onConnect`, `onEdgesChange`
- `nodes-change-slice.ts`: `onNodesChange` with extracted pure helpers

`confirmQuickAddNode`, `confirmEdgeInsertNode`, and `setViewport` remain in a slimmed `graph-slice.ts`.

**Alternatives considered**:
- *Split by data type (node-slice vs edge-slice)*: `onNodesChange` touches both nodes and edges; splitting by data type would force cross-slice reads and circular dependencies.
- *Single large file with regions*: Doesn't address testability; just adds visual structure.

**Why this approach**: Groups commands by frequency of change. Node CRUD changes when new node kinds are added; connection logic changes when edge types are added; `onNodesChange` changes when XYFlow's change API changes. They have different reasons to change, so they should live in different files.

---

### 4. Extensible NodeDefinition fields instead of a plugin hook

**Decision**: Add two optional fields to `NodeDefinition`:
```ts
extraExpressionConfigKeys?: string[]
renameConfigKey?: string
```
`setVariable/definition.ts` declares both. `refactor.ts` and `node-config-updates.ts` read these fields from the definition looked up by kind.

**Alternatives considered**:
- *`onConfigUpdate` lifecycle hook on NodeDefinition*: More powerful but harder to type, test, and reason about. Hooks can have arbitrary side effects.
- *Registry-level map from kind to config keys*: Extra indirection; the definition is already the registry record.

**Why this approach**: Declarative and type-safe. Adding a new kind that has expression fields or a rename key requires only editing its `definition.ts`. No generic code changes needed.

---

### 5. No changes to component store API (`useWorkflowStore`, `useWorkflowShallowStore`)

The subscription consolidation fixes in `workflow-editor.tsx` and `output-quick-add-affordance.tsx` are internal to those components. No hook signatures or selector exports change.

## Risks / Trade-offs

- **[Risk] Cache miss on every selector call after removing module-level cache** → `buildExpressionVariableCatalog` runs in < 1ms on typical graphs. The structural signature gate prevents most calls. If profiling shows regression, a `useMemo` in the consuming component is a targeted fix.
- **[Risk] New sub-slices introduce import cycle** → Each new slice imports from `helpers.ts` and `types.ts` only. The store factory in `store.ts` composes all slices. No slice imports another slice. Cycles are not possible with this pattern.
- **[Risk] `graph-refactors.ts` re-export file could be forgotten in future refactors** → The file is the canonical seam; a comment in `graph-refactors.ts` and in `refactor.ts` explains the boundary.

## Migration Plan

All changes are internal-only. No database migrations, API versioning, or feature flags needed.

1. Apply tasks in the order defined in `tasks.md` (correctness fixes first, then structural, then component layer).
2. Run `vitest run packages/flow` and `vitest run packages/store` after each task; fix any regressions before proceeding.
3. Run `pnpm typecheck` after each task group.
4. No rollback needed — each task is independently reversible via git revert.

## Open Questions

- Should `selectExpressionVariablesForNode` return a stable reference across calls with the same signature+nodeId without a component-level `useMemo`? Currently it recomputes on each call after removing the module cache. A future task could add write-back caching using a store action if profiling shows this matters.
