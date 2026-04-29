## Context

Workflow node registration currently has two separate paths:

- `registry.ts` imports pure node definitions and builds `nodeRegistry`.
- `component-bindings.ts` imports React components and mutates `nodeRegistry.<kind>.component`.
- `node-types-builder.tsx` imports `component-bindings.ts` for its side effect before building React Flow node types.

This makes node modules feel scattered. For example, the branch node definition lives in `nodes/logic/branch.ts`, its renderer lives in `nodes/logic/branch-node.tsx`, and its binding to the registry lives in `node-registry/component-bindings.ts`.

At the same time, the pure registry is used by store, validation, DTO mapping, graph engine, layout, and tests. Those layers should not import client-only React components. The design therefore needs to improve module cohesion without collapsing runtime metadata and client rendering into one import graph.

## Goals / Non-Goals

**Goals:**

- Make each workflow node a cohesive feature module that owns its definition, renderer, tests, and local helpers.
- Remove hidden registry mutation from `component-bindings.ts`.
- Remove side-effect imports from node type construction.
- Preserve a pure definition registry for non-UI workflow layers.
- Introduce an explicit client-side view registry for React Flow component bindings.
- Keep adding a node predictable: add node-owned files, then register the definition and optional component in clear manifests.

**Non-Goals:**

- Do not change workflow editor behavior, node semantics, graph persistence, or runtime config shape.
- Do not introduce dynamic filesystem-based module discovery or code generation.
- Do not redesign Node API v2 behavior hooks beyond the registration/module boundary.
- Do not rename node kinds or migrate persisted workflow data.

## Decisions

### Decision: Use node feature folders

Each node kind should move toward a folder structure like:

```text
nodes/logic/branch/
  definition.ts
  component.tsx
  index.ts
  branch-node.test.tsx
```

Shared node UI such as `NodeShell`, default renderer, and common hooks remains outside individual node folders.

Rationale: this makes the node itself the local unit of ownership. Developers can inspect a node by opening one folder instead of tracing definition, renderer, and binding across unrelated registry files.

Alternative considered: keep the current flat layout and only delete `component-bindings.ts`. That would remove mutation but would not solve the discoverability issue that motivated the change.

### Decision: Keep pure and client entrypoints separate

Node definitions remain importable without React component bindings. Client rendering imports components through a separate view registry.

Conceptually:

```text
branch/definition.ts  -> pure registry -> store, validation, mappers, graph engine
branch/component.tsx  -> view registry -> React Flow nodeTypes
```

Rationale: this preserves the existing architectural boundary. The pure registry stays safe for non-UI consumers while the canvas still gets explicit component bindings.

Alternative considered: store `component: BranchNode` directly inside each definition. This would make the object look self-contained, but it would force `registry.ts` to import client components and would leak UI dependencies into runtime layers.

### Decision: Replace mutation with an explicit view registry

Create a client-only registry, for example `node-registry/view-registry.tsx`, that maps node kinds to React Flow components:

```tsx
export const nodeComponents = {
  branch: BranchNode,
  setVariable: SetVariableNode,
  inlineExpression: InlineExpressionNode,
  extractor: ExtractorNode,
  result: ResultNode,
} satisfies Partial<Record<NodeKind, ComponentType<NodeProps>>>
```

`buildNodeTypes` should combine `allDefinitions` with `nodeComponents` explicitly. If no component exists for a definition, it uses `DefaultNodeRenderer`.

Rationale: the render boundary becomes readable and testable. Importing `node-types-builder.tsx` no longer mutates the pure registry as a side effect.

Alternative considered: let each node module export a combined `{ definition, component }` object. That is useful at the conceptual level, but a single combined object would again create a client import graph. Separate manifests are clearer for this codebase.

### Decision: Use thin manifests instead of automatic discovery

Keep central manifests for definitions and components. They should list node modules but not contain node-specific behavior.

Rationale: explicit manifests preserve type inference for `NodeKind`, are simple to test, and avoid bundler-specific discovery behavior. The cost is that adding a node still touches one pure manifest and one client manifest, but those touches are small and intentional.

Alternative considered: use `import.meta.glob` or similar automatic discovery. That could reduce manual registration, but it would add bundler coupling and make ordering/type inference less obvious.

## Risks / Trade-offs

- [Risk] Moving files can create broad import churn.
  - Mitigation: migrate one node category or one node at a time if needed, keeping compatibility exports during the transition.
- [Risk] Tests may accidentally import the client view registry when they only need pure node metadata.
  - Mitigation: keep naming explicit: `registry.ts` for pure metadata and `view-registry.tsx` for client rendering.
- [Risk] The new structure still requires two manifest edits when adding a custom-rendered node.
  - Mitigation: document this as intentional separation of runtime and UI entrypoints; add smoke tests that catch missing component bindings.
- [Risk] Existing Node API v2 wording may imply a single object must contain both metadata and component binding.
  - Mitigation: update the spec to define the node module as the source of truth, with separate pure and client entrypoints.

## Migration Plan

1. Introduce `view-registry.tsx` and update `node-types-builder.tsx` to consume it explicitly.
2. Remove `component-bindings.ts` and its side-effect import.
3. Move `branch` into a feature folder as the reference implementation.
4. Move remaining node definitions/components into equivalent feature folders.
5. Update imports across registry, tests, and node components.
6. Add or update registry smoke tests for:
   - pure registry definitions remain complete,
   - view registry component keys refer to valid `NodeKind` values,
   - `buildNodeTypes` uses explicit components and falls back for simple definitions.
7. Run focused workflow tests and typecheck.

Rollback is straightforward because no persisted data or runtime config shape changes are involved: restore the previous imports and side-effect binding file if the migration reveals unexpected bundling issues.

## Open Questions

- Should every node folder expose a `client.tsx` entrypoint, or is importing `component.tsx` from `view-registry.tsx` clear enough?
- Should simple nodes without custom components still have feature folders immediately, or should the first migration focus only on nodes that already have custom renderers?
