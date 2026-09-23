# Plan: Dependency injection for the canvas variable catalog

## Summary

The expression autocomplete catalog in `packages/flow` hardcodes two things a host should own: which node kinds produce a variable, and which of those variables a given node may see. Both move into injection seams — the producer side onto `NodeDefinition.variable`, the visibility side onto a `VariableScopeResolver` in `WorkflowRuntimeConfig` — so a host can offer *every* variable on the canvas instead of only the upstream ones, and can teach the catalog about its own node kinds without patching the core.

## User Story

As a host embedding the workflow editor,
I want to control which nodes contribute variables and which variables each node can reference,
So that my editor can surface the whole canvas's variables (not only the left-to-right upstream flow) and so my own node kinds participate in autocomplete.

## Problem → Solution

**Current state.** `packages/flow/src/workflow/expression/variables/variables.ts` answers both questions with literals:

- *Who produces* — `VARIABLE_NODE_KINDS = Set{extractor, setVariable, evaluator, jsonEvaluator}` gates the walk, then `readVariableName()` and `readVariableType()` each `switch` on `node.data.kind`.
- *Who sees* — `getReachableUpstreamNodes()` does a BFS up the incoming edges from the selected node.

A host cannot change either without forking the file, and the package's own two lists have already drifted apart (see Bug, below).

**Desired state.** The module holds no kind literals and no fixed traversal. It asks the registry what a node produces and asks the injected resolver which nodes are in scope, then applies the invariants it owns (self-exclusion, duplicate collapsing, sorting).

## Metadata

- **Complexity**: Medium
- **Source PRD**: N/A — design agreed conversationally before planning
- **PRD Phase**: N/A
- **Estimated Files**: 18 changed, 2 created

---

## Bug fixed along the way

`readVariableName()` has a `case "pathExtractor"` branch, but `"pathExtractor"` is **not** in `VARIABLE_NODE_KINDS`. The gate rejects the node before the reader is ever consulted, so Path Extractor variables have never reached autocomplete. Two independently maintained lists of the same fact drifted.

The DI design removes the class of bug rather than the instance: after this change, *being a producer* and *knowing how to read the name* are the same fact — the presence of `variable` on the definition. There is no second list to fall out of sync.

Note this means the fix is **behavioural**: `pathExtractor` variables start appearing in autocomplete where they previously did not. That is the intended correction, not a regression.

---

## UX Design

### Before

```
┌──────────────────────────────────────────────────────┐
│  A(var: userId) ──▶ B(var: city) ──▶ C [selected]    │
│                                                      │
│  D(var: token)        (not connected to C)           │
│                                                      │
│  C's autocomplete:   userId, city                    │
│                      ↑ only what flows into C        │
│  E(var: path)        ← pathExtractor, NEVER shown    │
└──────────────────────────────────────────────────────┘
```

### After (host passes `scope: graphScope`)

```
┌──────────────────────────────────────────────────────┐
│  A(var: userId) ──▶ B(var: city) ──▶ C [selected]    │
│                                                      │
│  D(var: token)        (not connected to C)           │
│  E(var: path)         (pathExtractor)                │
│                                                      │
│  C's autocomplete:   city, path, token, userId       │
│                      ↑ every variable on the canvas  │
│                        sorted by source node label   │
└──────────────────────────────────────────────────────┘
```

Default stays `upstreamScope`, so a host that passes no `runtime.variables` sees the "Before" behaviour — except for the `pathExtractor` fix, which applies to both scopes.

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Expression autocomplete list | Upstream producers only | Whatever the injected resolver returns, minus self | Default unchanged |
| Path Extractor as a source | Never listed | Listed under both scopes | Bug fix |
| Duplicate variable names | Each source emitted its own entry | One entry; description names every source | New invariant |
| A node referencing itself | Impossible (BFS never reaches self) | Impossible (core filters `nodeId`) | Invariant now explicit and tested |
| Evaluator operand type | `Record<string, WorkflowVariableType>` | `Record<string, string>`, narrowed inside the evaluator | No visible change |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `packages/flow/src/workflow/expression/variables/variables.ts` | all (183) | The module being rewritten; every reader body is lifted from here |
| P0 | `packages/flow/src/workflow/node-registry/define-node.ts` | 1–50 | `NodeDefinition` shape the `variable` field joins |
| P0 | `packages/flow/src/workflow/store/expression-deps.ts` | 83–140 | Cache builders; where registry + scope get read |
| P0 | `packages/flow/src/workflow/store/selectors.ts` | 88–115 | Both catalog selectors, one of which recomputes per call |
| P1 | `packages/flow/src/workflow/node-registry/registry.ts` | 1–90 | `NodeRegistry` contract and its ADR-0005/0006 rationale |
| P1 | `packages/flow/src/workflow/store/runtime.ts` | 170–190 | `normalizeWorkflowRuntimeConfig` — where the scope default lands |
| P1 | `packages/flow/src/workflow/store/types.ts` | 132–156 | `WorkflowRuntimeConfig` and `WorkflowStoreQueries` |
| P1 | `packages/flow/src/workflow/nodes/logic/evaluator-shared/operands.ts` | 108–150 | `resolveEffectiveLeftOperandType` — the sole type consumer |
| P1 | `packages/flow/src/workflow/store/store.ts` | 38–65 | The one call site needing explicit dependency passing |
| P2 | `packages/flow/src/workflow/expression/variables/variables.test.ts` | all (432) | Existing test conventions to preserve |
| P2 | `packages/flow/docs/adr/0005-empty-node-registry-by-default.md` | all | ADR voice and section structure to mirror in ADR-0009 |
| P2 | `packages/flow/src/workflow/nodes/data/set-variable/definition.ts` | all | Representative definition to extend |

## External Documentation

No external research needed — the feature uses established internal patterns (registry DI per ADR-0005/0006, runtime config injection per the existing `evaluator`/`nodeOptions` seams).

---

## Patterns to Mirror

### NAMING_CONVENTION

```ts
// SOURCE: packages/flow/src/workflow/node-registry/registry.ts:37-47
export interface NodeRegistry {
  /** The vocabulary, in palette order. */
  list(): readonly NodeDefinition[]
  /** The definition for a kind, or `undefined` when it is not in this registry. */
  get(kind: NodeKind): NodeDefinition | undefined
  /** True when the kind belongs to this registry. */
  has(kind: NodeKind): boolean
}
```

Interfaces and types are `PascalCase`; every public member carries a one-line doc comment explaining the *contract*, not the mechanics. Comments in this package justify decisions rather than restate code — match that register.

### OPTIONAL_DEFINITION_FIELD

```ts
// SOURCE: packages/flow/src/workflow/node-registry/define-node.ts:36-49
  /**
   * A bespoke renderer for this kind.
   *
   * Optional: a definition without one renders through `DefaultNodeRenderer`,
   * which draws any node from its `fields`. Declaring a view is how a kind opts
   * out of that generic treatment.
   */
  view?: ComponentType<NodeProps>
  validateConfigValue?: (key: string, value: unknown) => boolean
```

Optional capability fields on `NodeDefinition` are documented with what happens when the field is *absent*. `variable` must follow: absent means the kind produces no variable.

### RUNTIME_INJECTION

```ts
// SOURCE: packages/flow/src/workflow/store/types.ts:132-138
export interface WorkflowRuntimeConfig {
  evaluator?: WorkflowRuntimeEvaluatorConfig
  nodeOptions?: WorkflowNodeOptionsCatalog
  enableEvaluatorMultipleConditions?: boolean
  importDomain?: WorkflowRuntimeImportDomainConfig
  exportDomain?: WorkflowRuntimeExportDomainConfig
}
```

```ts
// SOURCE: packages/flow/src/workflow/store/runtime.ts:176-190
export function normalizeWorkflowRuntimeConfig(
  runtime: WorkflowRuntimeConfig = {}
): WorkflowRuntimeConfig {
  return {
    ...runtime,
    enableEvaluatorMultipleConditions:
      runtime.enableEvaluatorMultipleConditions ?? false,
    nodeOptions: normalizeNodeOptionsCatalog(runtime.nodeOptions),
    evaluator: { ... },
  }
}
```

Every runtime sub-config is optional on the public type and gets its default applied **once**, in `normalizeWorkflowRuntimeConfig`, never at each read site.

### DEFINITION_STRUCTURE

```ts
// SOURCE: packages/flow/src/workflow/nodes/data/set-variable/definition.ts:7-56
export const setVariable = defineNode({
  kind: "setVariable" as const,
  title: "Setter",
  description: "Create reusable variable value for downstream nodes.",
  icon: Braces,
  category: "data",
  fields: [ ... ],
  outputPaths: [],
  allowedTargets: [ ... ],
  buildDefaultConfig: () => ({
    variableName: "",
    variableType: "value" as WorkflowVariableType,
  }),
  renameConfigKey: "variableName",
  validateConfigValue: (key, value) => { ... },
})
```

Behavioural callbacks (`validateConfigValue`, `subtitle`) sit at the end of the object literal, after the declarative fields. Place `variable` in that trailing behavioural group.

### SHARED_DEFINITION_HELPERS

```ts
// SOURCE: packages/flow/src/workflow/nodes/logic/evaluator/definition.ts:4-11
import {
  buildDefaultEvaluatorConfig,
  evaluatorSubtitle,
  EVALUATOR_ALLOWED_TARGETS,
  EVALUATOR_OUTPUTS,
  validateEvaluatorConfigValue,
} from "../evaluator-shared/config"
```

`evaluator` and `jsonEvaluator` share every behaviour through `evaluator-shared/config`. Their identical variable reader belongs there too, as `readEvaluatorVariable` — **not** duplicated into two definition files.

### TEST_STRUCTURE

```ts
// SOURCE: packages/flow/src/workflow/expression/variables/variables.test.ts:1-58
import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import type { WorkflowEdge } from "../../types/types"
import { collectWorkflowVariables } from "./variables"
import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../../node-registry/registry"

const registry = createNodeRegistry(builtinBaseDefinitions)

describe("collectWorkflowVariables", () => {
  it("exposes upstream extractor extractExpression as plain variable", () => {
    const extractor = createWorkflowNode(registry, "extractor", { x: 0, y: 0 }, "Extractor Title")
    extractor.data.config.extractExpression = "price"
    const inline = createWorkflowNode(registry, "inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: extractor.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: extractor.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([extractor, inline], edges, inline.id)

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("price")
  })
})
```

Tests build real nodes through `createWorkflowNode(registry, kind, position, label)` against `builtinBaseDefinitions` (the component-free set), mutate `data.config` directly, and hand-write edge literals including the `data.sourceKind`/`data.targetKind` pair. Test names are full behavioural sentences. Keep all of this.

### ADR_STRUCTURE

```markdown
// SOURCE: packages/flow/docs/adr/0005-empty-node-registry-by-default.md:1-7
# ADR-0005: The node registry ships empty

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: flow package maintainers

## Context
...
## Decision
## Alternatives Considered
### Alternative 1: <name>
- **Pros**: ...
- **Cons**: ...
- **Why not**: ...
## Consequences
```

Titles are assertive sentences ("The node registry ships empty", "The host owns layout"), not noun phrases.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `packages/flow/src/workflow/expression/variables/variable-scope.ts` | CREATE | `VariableScopeResolver` type + `upstreamScope` / `graphScope` |
| `packages/flow/docs/adr/0009-the-host-owns-variable-scope.md` | CREATE | Records the DI decision per package convention |
| `packages/flow/src/workflow/expression/variables/variables.ts` | UPDATE | Remove kind literals and traversal; consume registry + resolver |
| `packages/flow/src/workflow/expression/variables/variables.test.ts` | UPDATE | Rewrite for injection |
| `packages/flow/src/workflow/expression/variables/index.ts` | UPDATE | Re-export the scope module |
| `packages/flow/src/workflow/node-registry/define-node.ts` | UPDATE | Add `NodeVariable`, `NodeVariableSource`, `NodeVariableReader`, `variable?` |
| `packages/flow/src/workflow/nodes/data/set-variable/definition.ts` | UPDATE | Own its reader |
| `packages/flow/src/workflow/nodes/data/extractor/definition.ts` | UPDATE | Own its reader |
| `packages/flow/src/workflow/nodes/data/path-extractor/definition.ts` | UPDATE | Own its reader (fixes the bug) |
| `packages/flow/src/workflow/nodes/logic/evaluator-shared/config.ts` | UPDATE | Add shared `readEvaluatorVariable` |
| `packages/flow/src/workflow/nodes/logic/evaluator/definition.ts` | UPDATE | Wire the shared reader |
| `packages/flow/src/workflow/nodes/logic/json-evaluator/definition.ts` | UPDATE | Wire the shared reader |
| `packages/flow/src/workflow/nodes/logic/evaluator-shared/operands.ts` | UPDATE | Narrow the opaque tag locally |
| `packages/flow/src/workflow/nodes/logic/evaluator-shared/condition-row.tsx` | UPDATE | Prop type → `Record<string, string>` |
| `packages/flow/src/workflow/store/types.ts` | UPDATE | `variables?` on runtime; types cache in queries |
| `packages/flow/src/workflow/store/runtime.ts` | UPDATE | Default the resolver to `upstreamScope` |
| `packages/flow/src/workflow/store/expression-deps.ts` | UPDATE | Build both caches from registry + resolver |
| `packages/flow/src/workflow/store/slices/expression-slice.ts` | UPDATE | Accept registry + resolver |
| `packages/flow/src/workflow/store/store.ts` | UPDATE | Pass them at line ~54 |
| `packages/flow/src/workflow/store/selectors.ts` | UPDATE | Read types from cache |
| `packages/flow/src/index.tsx` | UPDATE | Public exports |

## NOT Building

- **No enum form of scope.** `runtime.variables.scope` takes a function only. `upstreamScope`/`graphScope` are exported implementations, not string tokens.
- **No removal of `WorkflowVariableType`.** It stays in `types/variable-types.ts` and stays publicly exported — it is the evaluator's operand model, the `WorkflowTypeSelect` vocabulary, and the `select` options of `setVariable`/`extractor`. Only its role as a *catalog contract* ends.
- **No new variable type tags.** `"value" | "array"` remain the only tags the built-ins emit. The API merely stops *forbidding* others.
- **No change to the `ExpressionVariableOption` shape** (`{ value, label, description, group }` in `@flow/expression-editor`).
- **No scope control per node kind or per field.** Scope is per editor instance.
- **No caching inside resolvers.** The store's structural-signature cache already covers it.
- **No change to `refactor.ts`.** Variable renaming already goes through the registry.

---

## Step-by-Step Tasks

### Task 1: Add the producer contract to `NodeDefinition`

- **ACTION**: Extend `packages/flow/src/workflow/node-registry/define-node.ts`.
- **IMPLEMENT**:
  ```ts
  /** The slice of a node a variable reader may inspect. */
  export interface NodeVariableSource {
    id: string
    label: string
    config: Record<string, unknown>
  }

  export interface NodeVariable {
    name: string
    /**
     * A tag the catalog carries but never interprets. Meaning is the
     * consumer's: the built-in evaluator reads `"array"` as a multi-value
     * operand and treats every other tag as a single value.
     */
    type?: string
  }

  /**
   * How a kind reports the variable it produces.
   *
   * Optional: a definition without one produces no variable and never reaches
   * the catalog. Returning `null` says the same thing for a given node — the
   * name is empty, or not a valid identifier right now.
   */
  export type NodeVariableReader = (
    node: NodeVariableSource
  ) => NodeVariable | null
  ```
  Then add `variable?: NodeVariableReader` to `NodeDefinition`, in the trailing behavioural group beside `validateConfigValue`.
- **MIRROR**: OPTIONAL_DEFINITION_FIELD, NAMING_CONVENTION.
- **IMPORTS**: none new.
- **GOTCHA**: Deliberately do **not** import `WorkflowVariableType` here. `define-node.ts` currently has no dependency on `types/variable-types`, and keeping it that way is the point of the whole change.
- **VALIDATE**: `cd packages/flow && pnpm typecheck` — clean, since the field is optional.

### Task 2: Create the scope resolver module

- **ACTION**: Create `packages/flow/src/workflow/expression/variables/variable-scope.ts`.
- **IMPLEMENT**:
  ```ts
  export interface VariableScopeNode {
    id: string
    kind: string
    label: string
    config: Record<string, unknown>
  }

  export interface VariableScopeEdge {
    source: string
    target: string
  }

  export interface VariableScopeInput {
    nodes: readonly VariableScopeNode[]
    edges: readonly VariableScopeEdge[]
    /** The node the catalog is being built for. */
    nodeId: string
  }

  /**
   * Which nodes may contribute a variable to `nodeId`.
   *
   * Returns candidate node ids, in any order — the catalog sorts by source
   * label. A resolver cannot grant a node sight of its own variable: the
   * catalog drops `nodeId` from whatever comes back, because a self-reference
   * is a cycle.
   */
  export type VariableScopeResolver = (
    input: VariableScopeInput
  ) => readonly string[]

  export const upstreamScope: VariableScopeResolver = ({ edges, nodeId }) => { ... }

  export const graphScope: VariableScopeResolver = ({ nodes }) =>
    nodes.map((node) => node.id)
  ```
  Lift the `upstreamScope` body verbatim from `getReachableUpstreamNodes` (`variables.ts:151-183`): build `incomingByTarget`, BFS from `nodeId`, collect `visited`. Return ids only — the node lookup and the label sort move to the catalog.
- **MIRROR**: NAMING_CONVENTION.
- **IMPORTS**: none — this module must stay dependency-free.
- **GOTCHA**: `getReachableUpstreamNodes` ends with `.sort((l, r) => l.data.label.localeCompare(r.data.label))`. That sort belongs to the **catalog**, not the resolver — otherwise `graphScope` would have to duplicate it and a host resolver would silently produce unsorted output. Do not carry the sort across.
- **VALIDATE**: `pnpm typecheck`.

### Task 3: Rewrite the catalog around the two seams

- **ACTION**: Rewrite `packages/flow/src/workflow/expression/variables/variables.ts`.
- **IMPLEMENT**:
  ```ts
  export interface WorkflowVariableCatalog {
    options: ExpressionVariableOption[]
    types: Record<string, string>
  }

  export function collectWorkflowVariables(
    registry: NodeRegistry,
    scope: VariableScopeResolver,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    selectedNodeId: string | null
  ): WorkflowVariableCatalog
  ```
  Algorithm:
  1. `if (!selectedNodeId) return { options: [], types: {} }`.
  2. Project `nodes`/`edges` to `VariableScopeNode[]`/`VariableScopeEdge[]` and call `scope({ nodes, edges, nodeId: selectedNodeId })`.
  3. Resolve returned ids against a `Map<string, WorkflowNode>`; drop unknown ids and drop `selectedNodeId` (**the invariant**).
  4. Sort the resolved nodes by `data.label.localeCompare`.
  5. For each, `registry.get(node.data.kind)?.variable?.({ id, label: node.data.label, config: node.data.config })`; skip `null`/`undefined`; skip an empty `name`.
  6. Group by `name` in that order. First source wins the `type`. Accumulate every source label.
  7. Emit one option per name: `{ group: "Variables", label: name, value: name, description }`, where `description` is `Variable from "A" node.` for one source and `Variable from "A", "B".` for several. Fill `types[name]` only when the winning source returned a `type`.
- **MIRROR**: NAMING_CONVENTION; keep the existing `group: "Variables"` / `label === value` shape.
- **IMPORTS**: `ExpressionVariableOption`, `WorkflowEdge`, `WorkflowNode` from `../../types/types`; `NodeRegistry` from `../../node-registry/registry`; `VariableScopeResolver` and friends from `./variable-scope`.
- **GOTCHA**: Delete `collectWorkflowVariableTypes` entirely — the single pass replaces it. Also delete `VARIABLE_NODE_KINDS`, `readVariableName`, `readSetVariableName`, `readExtractorVariableName`, `readPathExtractorVariableName`, `readEvaluatorLabel`, `readVariableType`, `getReachableUpstreamNodes`, and the `isValidJsIdentifier` import (it moves to the definitions). **The completion criterion for this task is that the file imports nothing from `../../types/variable-types`.**
- **VALIDATE**:
  ```bash
  cd packages/flow && grep -c "variable-types" src/workflow/expression/variables/variables.ts
  ```
  EXPECT: `0`.

### Task 4: Move the five readers onto their definitions

- **ACTION**: Add `variable` to each producing definition.
- **IMPLEMENT**:
  - `set-variable/definition.ts` — from `readSetVariableName` + `readVariableType`:
    ```ts
    variable: (node) => {
      const raw = node.config.variableName
      if (typeof raw !== "string") return null
      const name = raw.trim()
      if (!name || !isValidJsIdentifier(name)) return null
      return { name, type: node.config.variableType === "array" ? "array" : "value" }
    },
    ```
  - `extractor/definition.ts` — same shape on `extractExpression`, but **falls back to `node.label.trim()`** when the config value is missing or not a valid identifier (preserve `readExtractorVariableName` exactly, including that the fallback is *not* itself identifier-checked); `type` from `config.variableType === "array"`.
  - `path-extractor/definition.ts` — `name` is `node.label.trim()` (the node has no label field of its own); return `null` when empty; `type` is `"array"` when `config.outputType` is `"arrayValue"` or `"arrayObject"`, else `"value"`. Keep the existing explanatory comment from `readPathExtractorVariableName`.
  - `evaluator-shared/config.ts` — export `readEvaluatorVariable`, from `readEvaluatorLabel`: read `config.label`, require a non-empty valid identifier, return `{ name }` with **no** `type` (evaluators never had one). Wire it as `variable: readEvaluatorVariable` in both `evaluator/definition.ts` and `json-evaluator/definition.ts`.
- **MIRROR**: DEFINITION_STRUCTURE (trailing behavioural group), SHARED_DEFINITION_HELPERS (one reader for both evaluators).
- **IMPORTS**: `import { isValidJsIdentifier } from "../../../expression/variable-name"` in the three data definitions; `../../../expression/variable-name` from `evaluator-shared/config.ts` (verify depth from that file's own location).
- **GOTCHA 1**: `path-extractor` is the bug fix — it had a reader but no registration. It must get `variable` like the rest.
- **GOTCHA 2**: The `type` tags stay the literals `"array"`/`"value"`. Do not import `WorkflowVariableType` to annotate them; `NodeVariable.type` is `string` and a literal satisfies it. These files may keep their *existing* `WorkflowVariableType` imports for `buildDefaultConfig` — that is the node's own field vocabulary and is out of scope.
- **GOTCHA 3**: Do not touch `inlineExpression` or `result` — they produce no variables.
- **VALIDATE**: `pnpm typecheck`, and confirm `builtin-base-definitions.ts` needs no edit (it imports the same `definition.ts` modules, so both built-in sets inherit the readers).

### Task 5: Inject the resolver through runtime config

- **ACTION**: Edit `store/types.ts` and `store/runtime.ts`.
- **IMPLEMENT**:
  ```ts
  // types.ts
  export interface WorkflowRuntimeVariablesConfig {
    /** Which nodes may contribute variables. Defaults to `upstreamScope`. */
    scope?: VariableScopeResolver
  }

  export interface WorkflowRuntimeConfig {
    // ...existing
    variables?: WorkflowRuntimeVariablesConfig
  }
  ```
  ```ts
  // runtime.ts, inside normalizeWorkflowRuntimeConfig's return
  variables: {
    ...runtime.variables,
    scope: runtime.variables?.scope ?? upstreamScope,
  },
  ```
- **MIRROR**: RUNTIME_INJECTION.
- **IMPORTS**: `VariableScopeResolver` / `upstreamScope` from `../expression/variables/variable-scope`.
- **GOTCHA**: Default exactly once, here. Read sites use `state.runtime.variables?.scope ?? upstreamScope` only as a type-level convenience — never re-derive the default elsewhere. Guard against a host passing a non-function: `typeof scope === "function" ? scope : upstreamScope`, consistent with how `normalizeEvaluatorOperators` rejects malformed host input rather than trusting it.
- **VALIDATE**: `pnpm typecheck`.

### Task 6: Rewire the store caches

- **ACTION**: Edit `store/expression-deps.ts`, `store/slices/expression-slice.ts`, `store/store.ts`, `store/types.ts`, `store/selectors.ts`.
- **IMPLEMENT**:
  1. `types.ts` — add `expressionVariableTypesCache: Map<string, Record<string, string>>` to `WorkflowStoreQueries`, beside `expressionCatalogCache`.
  2. `expression-deps.ts` — `buildExpressionCatalogCache(registry, scope, graph)` returns both maps from one `collectWorkflowVariables` call per node. `buildExpressionSliceState` gains `registry` and `scope` parameters. `buildExpressionSlicePatch` reads them off its existing `state` argument: `state.registry` and `state.runtime.variables?.scope ?? upstreamScope`. Add both cache keys to the two `Pick<...>` return types.
  3. `expression-slice.ts` — `createExpressionSlice(initialGraph, registry, scope)`.
  4. `store.ts:54` — `...createExpressionSlice(initialGraph, registry, runtime.variables?.scope ?? upstreamScope)`. `registry` and `runtime` are already in scope from lines 44–45.
  5. `selectors.ts` — `selectExpressionVariableTypesForNode` reads `state.expressionVariableTypesCache.get(nodeId) ?? {}`, mirroring `selectExpressionVariablesForNode`. Drop the `collectWorkflowVariableTypes` and `WorkflowVariableType` imports; the return type becomes `Record<string, string>`.
- **MIRROR**: the existing `selectExpressionVariablesForNode` cache-read shape (`selectors.ts:90-100`).
- **IMPORTS**: `upstreamScope` in `expression-deps.ts` and `store.ts`.
- **GOTCHA 1**: The six `buildExpressionSlicePatch` call sites — `history-helpers.ts:31,45`, `slices/io-slice.ts:199`, `slices/history-slice.ts:37`, `slices/layout-slice.ts:58`, `slices/graph-slice.ts:174`, `slices/node-crud-slice.ts:106` — **need no edits**. Every one already passes `state` first, and `state` carries both `registry` and `runtime`. If you find yourself changing one, the patch builder is reading its dependencies from the wrong place.
- **GOTCHA 2**: `buildExpressionSlicePatch` early-returns `{}` when the structural signature is unchanged. Both caches must be rebuilt together *after* that guard, or the types cache will drift from the options cache.
- **GOTCHA 3**: Keep the `cache.set("__global__", [])` seed in the catalog cache and add the matching `{}` seed to the types cache — `selectExpressionVariablesForNode` maps a `null` nodeId onto that key.
- **VALIDATE**: `pnpm typecheck`, then `pnpm test` in `packages/flow`.

### Task 7: Narrow the tag inside the evaluator

- **ACTION**: Edit `nodes/logic/evaluator-shared/operands.ts` and `condition-row.tsx`.
- **IMPLEMENT**: In `resolveEffectiveLeftOperandType`, change the `variableTypes` parameter to `Record<string, string>` and the tail to:
  ```ts
  const variableType = variableTypes[variableName]
  if (!variableType) {
    return { type: "value", unresolvedVariableName: variableName }
  }
  return { type: variableType === "array" ? "array" : "value" }
  ```
  Change `ConditionRowProps.variableTypes` to `Record<string, string>` to match.
- **MIRROR**: existing function structure — only the lookup tail changes.
- **IMPORTS**: unchanged. `WorkflowVariableType` stays imported for the *return* type, which really is the closed union.
- **GOTCHA**: Preserve the two-case distinction. **Absent** entry → `unresolvedVariableName` (the variable does not exist; the UI flags it). **Present but unrecognised** → plain `"value"`, no flag (the variable exists, its tag is just not one this evaluator knows). Collapsing these would make every host-defined tag render as a broken reference.
- **VALIDATE**: `pnpm test` — the evaluator suites must stay green untouched.

### Task 8: Export the public surface

- **ACTION**: Edit `packages/flow/src/index.tsx` and the two barrel files.
- **IMPLEMENT**:
  - `expression/variables/index.ts` — `export * from "./variable-scope"` alongside the existing `./variables`.
  - `index.tsx`, in the existing `./workflow/node-registry` block: add `type NodeVariable`, `type NodeVariableReader`, `type NodeVariableSource`.
  - `index.tsx`, new block: `export { graphScope, upstreamScope, type VariableScopeEdge, type VariableScopeInput, type VariableScopeNode, type VariableScopeResolver } from "./workflow/expression/variables"`.
  - `index.tsx`: `export { isValidJsIdentifier } from "./workflow/expression/variable-name"`.
  - `index.tsx`: add `WorkflowRuntimeVariablesConfig` to the existing `./workflow/store/types` type block.
- **MIRROR**: the file's existing grouping — one `export { ... } from` block per source module, members alphabetised, `type` prefix on type-only members.
- **IMPORTS**: N/A.
- **GOTCHA**: `node-registry/index.ts` already does `export * from "./define-node"`, so the three new types flow through automatically; only the explicit re-export in `index.tsx` needs adding.
- **VALIDATE**: `pnpm build` at the repo root.

### Task 9: Rewrite the catalog tests

- **ACTION**: Rewrite `expression/variables/variables.test.ts`; add `variable-scope.test.ts`.
- **IMPLEMENT**: Keep the existing harness (`createNodeRegistry(builtinBaseDefinitions)`, `createWorkflowNode`, hand-written edges). Thread `registry` and an explicit scope through every `collectWorkflowVariables` call, and read `.options` / `.types` off the result. Port every existing case, then add the new ones from the Testing Strategy table.
- **MIRROR**: TEST_STRUCTURE.
- **IMPORTS**: add `graphScope`, `upstreamScope` from `./variable-scope`.
- **GOTCHA**: The old assertion `options` is now `result.options`. Do not weaken the ported cases into smoke tests while adapting the shape.
- **VALIDATE**: `pnpm test:coverage` in `packages/flow` — threshold is 70%.

### Task 10: Record ADR-0009

- **ACTION**: Create `packages/flow/docs/adr/0009-the-host-owns-variable-scope.md`; add its row to `docs/adr/README.md`.
- **IMPLEMENT**: Sections `Context` / `Decision` / `Alternatives Considered` / `Consequences`, with the `**Date**` / `**Status**` / `**Deciders**` header block. Context: the two hardcodings, and the drifted `pathExtractor` list as evidence the duplication was already costing correctness. Decision: both seams, plus the self-exclusion invariant and why the core owns it rather than the resolver. Alternatives: (1) a `"upstream" | "graph"` enum — rejected, a third algorithm would reopen the core; (2) keeping `WorkflowVariableType` in the catalog contract — rejected, it is the evaluator's operand model and would forbid host-defined tags; (3) declarative `{ nameKey, typeKey }` instead of a reader function — rejected, it cannot express `pathExtractor` (name from label) or the evaluator rules.
- **MIRROR**: ADR_STRUCTURE. Title is an assertive sentence, matching ADR-0007 "The host owns layout".
- **IMPORTS**: N/A.
- **GOTCHA**: `README.md` rows are `| [0009](file.md) | Title | accepted | YYYY-MM-DD |`. Title in the table omits the `ADR-000N:` prefix.
- **VALIDATE**: `pnpm format` at the repo root.

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| no selected node | `selectedNodeId = null` | `{ options: [], types: {} }` | yes |
| upstream producer listed | A→B, A is `extractor` with `extractExpression = "price"` | `options[0].value === "price"` | no |
| extractor falls back to label | `extractExpression = "{{ invalid }}"`, label `fallbackLabel` | name is `fallbackLabel` | yes |
| non-producer contributes nothing | upstream `inlineExpression` | `options` empty | no |
| **pathExtractor now listed** | upstream `pathExtractor` labelled `city` | `options` contains `city` | regression guard |
| **pathExtractor array tag** | `outputType = "arrayObject"` | `types.city === "array"` | no |
| **graphScope sees disconnected** | A(`userId`), C, no edges, catalog for C | `options` contains `userId` | no |
| **upstreamScope ignores disconnected** | same graph, `upstreamScope` | `options` empty | no |
| **self excluded** | `setVariable` node asks for its own catalog | its own name absent | yes |
| **hostile resolver cannot self-reference** | resolver returns `[nodeId]` | own name still absent | yes |
| **duplicates collapse** | A(`user`), B(`user`), catalog for C | one option; description names A and B | yes |
| **first source wins the type** | A(`user`, value), B(`user`, array), A sorts first | `types.user === "value"` | yes |
| single-source description | one producer `A` | `Variable from "A" node.` | no |
| unknown id from resolver | resolver returns a stale id | ignored, no throw | yes |
| definition without `variable` | host kind lacking the field | contributes nothing | yes |
| reader returning `null` | `setVariable` with empty `variableName` | contributes nothing | yes |
| host tag survives transit | reader returns `type: "json"` | `types.x === "json"` | yes |
| evaluator treats unknown tag as value | `variableTypes = { x: "json" }` | `{ type: "value" }`, **no** `unresolvedVariableName` | yes |
| evaluator flags missing variable | `variableTypes = {}` | `{ type: "value", unresolvedVariableName: "x" }` | yes |
| `graphScope` returns every id | 3-node graph | length 3 | no |
| `upstreamScope` handles a cycle | A→B→A | terminates | yes |

### Edge Cases Checklist

- [ ] Empty graph (no nodes, no edges)
- [ ] `selectedNodeId` absent from `nodes`
- [ ] Resolver returns `[]`
- [ ] Resolver returns ids not present in `nodes`
- [ ] Resolver returns `nodeId` itself
- [ ] Cyclic edges under `upstreamScope`
- [ ] Node whose kind is not in the registry
- [ ] Variable name that is whitespace only
- [ ] Two producers, same name, different type tags
- [ ] Reader that throws — *not* guarded; a broken host reader should fail loudly rather than silently drop a variable

---

## Validation Commands

### Static Analysis
```bash
cd /Users/sergejolcev/Desktop/sber/xyflow && pnpm typecheck
```
EXPECT: zero type errors.

### Lint
```bash
cd /Users/sergejolcev/Desktop/sber/xyflow && pnpm lint
```
EXPECT: zero errors.

### Unit Tests — affected area
```bash
cd /Users/sergejolcev/Desktop/sber/xyflow/packages/flow && pnpm vitest run src/workflow/expression
```
EXPECT: all pass.

### Full Test Suite
```bash
cd /Users/sergejolcev/Desktop/sber/xyflow && pnpm test
```
EXPECT: no regressions in `flow` (70% threshold) or `store` (90%).

### Coverage
```bash
cd /Users/sergejolcev/Desktop/sber/xyflow/packages/flow && pnpm test:coverage
```
EXPECT: ≥70%.

### Decoupling Check — the criterion for "done"
```bash
cd /Users/sergejolcev/Desktop/sber/xyflow/packages/flow && \
  grep -rn "variable-types" src/workflow/expression/ ; \
  grep -rn "VARIABLE_NODE_KINDS" src/
```
EXPECT: no output from either.

### Build
```bash
cd /Users/sergejolcev/Desktop/sber/xyflow && pnpm build
```
EXPECT: success; new exports resolve.

### Manual Validation
- [ ] `pnpm dev`; open `apps/web`
- [ ] Default host (no `runtime.variables`): a node's expression autocomplete offers only upstream variables — unchanged
- [ ] Add a Path Extractor upstream, give it a label, confirm it now appears (the bug fix)
- [ ] Pass `runtime={{ variables: { scope: graphScope } }}`: a disconnected node's variables appear
- [ ] Under `graphScope`, a `setVariable` node does not offer its own name
- [ ] Two nodes sharing a variable name produce one entry whose description names both
- [ ] Evaluator left operand still flips to array UI for an `array` variable

---

## Acceptance Criteria

- [ ] `VARIABLE_NODE_KINDS` and every `switch (node.data.kind)` are gone from `variables.ts`
- [ ] `expression/variables/` imports nothing from `types/variable-types`
- [ ] `runtime.variables.scope` accepts a `VariableScopeResolver`; default is `upstreamScope`
- [ ] `graphScope` surfaces every canvas variable
- [ ] A resolver returning `nodeId` still cannot make a node see itself
- [ ] Path Extractor variables appear in autocomplete
- [ ] Duplicate names collapse to one entry naming all sources
- [ ] Variable types come from the cache, not a per-call graph walk
- [ ] All validation commands pass
- [ ] ADR-0009 written and indexed

## Completion Checklist

- [ ] Code follows the discovered patterns
- [ ] Comments justify decisions, matching package voice
- [ ] Tests follow `createWorkflowNode` + `builtinBaseDefinitions` conventions
- [ ] No hardcoded kind literals outside definition files
- [ ] No `cn` in `packages/flow` (`tv` from `tailwind-variants` only)
- [ ] ADR index updated
- [ ] No unnecessary scope additions
- [ ] Self-contained — no questions needed during implementation

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| The `pathExtractor` fix surprises a host relying on the current (broken) behaviour | Low | Low | Intended correction; call it out in the ADR Consequences and the changelog |
| Duplicate collapsing hides that two nodes write the same name | Medium | Low | Description enumerates every source, so the collision is visible in the UI |
| `graphScope` lets a host build a cyclic variable reference the backend rejects | Medium | Medium | Out of scope by design — the host chose canvas-wide visibility. Core only guarantees no *self*-reference. Note it in ADR Consequences |
| A second cache map drifts from the first | Low | High | Both built in one pass inside one function, after the signature guard; a test asserts an option and its type agree |
| Touching six slice call sites unnecessarily | Medium | Medium | GOTCHA 1 on Task 6 names all six as no-ops and explains why |
| `graphScope` is O(n) per node → O(n²) per rebuild | Low | Low | Rebuild is signature-gated, and n is canvas-sized. Revisit only if `perf-budget.md` flags it |

## Notes

- **Why the scope seam sits on `runtime` and the producer seam on `NodeDefinition`**: they answer questions with different owners. *What does my node produce* is a property of the kind, so it travels with the definition — the same reasoning as ADR-0006 putting the vocabulary on the instance. *Who may see whose variables* is an editor-wide policy independent of any kind, which is exactly what `WorkflowRuntimeConfig` already holds for the evaluator catalog and node options.

- **Why the core, not the resolver, enforces self-exclusion**: an invariant a plugin can violate is not an invariant. `upstreamScope` never reaches the node anyway; `graphScope` would have to remember to filter; a host resolver would certainly forget. One filter in the catalog covers all three, and a hostile-resolver test pins it.

- **Why `NodeVariable.type` is `string` and not `WorkflowVariableType`**: tracing the consumers showed exactly one — `resolveEffectiveLeftOperandType`, which only ever asks "is this `array`". The closed union was never the catalog's fact; it is the evaluator's operand model. Widening it to an opaque tag lets a host emit `"json"` or `"date"` for its own evaluator while the built-in one degrades to `"value"`. This is the same move ADR-0005 made when `NodeKind` stopped being a closed union: validity became a runtime question answered by the injected party.

- **Sequencing**: Tasks 1–2 are additive and safe to land first. Task 3 breaks compilation until Tasks 4 and 6 land, so treat 3–6 as one unit. Tasks 7–10 are independent afterwards.
