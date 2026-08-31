# ADR-0006: A node vocabulary is an instance prop, not a module singleton

**Date**: 2026-08-31
**Status**: accepted
**Deciders**: flow package maintainers

## Context

ADR-0005 decided that the registry ships empty and every kind an editor
offers arrives from the consumer. It did not change how the registry itself
was built: `registerNodeDefinitions` mutated a module-level store, and
`subscribeNodeDefinitions` let React re-render when that store changed. The
mechanism was a singleton with listeners bolted on, and living with it for a
while surfaced three problems that ADR-0005's decision could not fix on its
own.

Two editors on one page could not hold different vocabularies. ADR-0005
already named this defect when it rejected an `excludeBuiltins` prop — "the
registry is a module-level store and the prop is per-instance, so two editors
on one page would disagree about what exists" — but kept the singleton that
caused it, because the empty-by-default decision didn't require touching the
mechanism yet.

Registration was an import-order hazard. ADR-0005's own mitigation for this
was procedural, not structural: "registration is idempotent and cheap, so it
belongs at module scope in the entry point, above any graph construction,"
and for the storybook examples, where import order isn't obvious,
registration had to live in its own module that those files import, "since an
import is evaluated before the body of the module importing it." Get the
order wrong and a graph built at module scope calls the node factory before
anyone registered anything, and fails at import time with `Unknown node
kind`. The mitigation worked, but it was advice for surviving a hazard the
mechanism kept in place.

And the subscription existed for one reason alone: to paper over a
mount-order race. A canvas that rendered before registration ran needed to be
woken up once it finished, so `subscribeNodeDefinitions` gave every store a
listener whose entire job was catching up after the fact.

## Decision

`createNodeRegistry(definitions)` builds an immutable `NodeRegistry` — `list`
/ `get` / `has` / `kinds` — from a plain definition array, with no module
state and no listeners. It reaches the React tree the same way another
instance-scoped configuration value already did: `runtime` already travelled
through `WorkflowStoreInitialProps` into `createContextStore`, read by store
slices as `get().runtime`. The vocabulary follows that exact path —
`WorkflowStoreInitialProps.definitions` builds `state.registry` — so a host
writes `<WorkflowEditor definitions={…}>` and gets a registry scoped to that
one editor instance.

The pure layer — the node factory, config normalization, graph rules, elk
ports, expression refactoring, the mappers — is not React and cannot read a
store or a context, so each of those takes `registry: NodeRegistry` as an
explicit first argument. Store slices supply it from `get().registry`.
Host-facing helpers that used to read the module singleton implicitly —
`createInitialGraph`, `createInitialGraphElk`, `createKeywordSampleGraph` —
now take the plain definition array and build the registry internally, so a
host never constructs one by hand just to call them.

The second module singleton, `view-registry`, mapped kind to React component
and shared the same listener list as the definition registry, so registering
a view woke subscribers of the vocabulary — two concerns coupled through one
notification channel. A renderer is a property of a node kind, not a
parallel index of one, so it became `NodeDefinition.view?:
ComponentType<NodeProps>`, and `buildNodeTypes` reads it directly off each
definition.

The view is wired in a node's `index.ts`, never in its `definition.ts`. A
node's own component imports its definition to read static metadata such as
`fields` (see `nodes/logic/evaluator/component.tsx`) — attaching the
component inside `definition.ts` would close that into an import cycle.
Instead each node's `index.ts` composes the two exports it owns:

```ts
export const evaluator = { ...base, view: EvaluatorNode }
```

`registration.ts`, `registerNodeDefinitions` and `subscribeNodeDefinitions`
are deleted; there is nothing left to register into and nothing left to
subscribe to.

## Alternatives Considered

### Alternative 1: A facade prop that registers into a surviving singleton on mount
- **Pros**: cheap — `<WorkflowEditor definitions={…}>` calls
  `registerNodeDefinitions` in an effect, and no consumer of the pure layer
  needs to change its signature.
- **Cons**: it is exactly the shape ADR-0005 already rejected for
  `excludeBuiltins`: a per-instance prop feeding a module-level store. Two
  editors mounted together still fight over one vocabulary, whichever
  registered last. Per-instance state stays expressed as a side effect on
  shared state instead of as the state itself.
- **Why not**: it would have re-created the two-editors-one-page conflict on
  purpose, in the same commit that claims to be fixing it.

### Alternative 2: Move `view-registry` into the store as its own map
- **Pros**: smaller diff — one new store slice next to `registry`, no change
  to `NodeDefinition`'s shape, no change to how a node's `index.ts` is
  written.
- **Cons**: keeps two parallel stores for one concept (a kind and its
  renderer), and preserves the exact coupling that made registering a view
  wake subscribers of the definition registry — a store slice for views would
  still need its own subscription plumbing distinct from `registry`, since
  the store doesn't run effects on plain field assignment the way the old
  listener list did.
- **Why not**: it would have traded a module-level coupling for a store-level
  one instead of removing it. A view is a property of a definition; recording
  it anywhere else keeps asking "which of these two places is this kind's
  renderer in."

## Consequences

### Positive
- Two editors on one page hold independent vocabularies, because each
  editor's registry lives in that editor's own store state, not in shared
  module state.
- The import-order hazard is gone by construction rather than by convention:
  a prop cannot be read before it is passed, so there is no ordering to get
  right or wrong.
- `subscribeNodeDefinitions` and the mount-order race it existed to patch are
  both deleted — there is no longer a window between mount and registration
  for a canvas to render into.
- The storybook's dedicated registration module — justified in ADR-0005
  purely by import-evaluation order — is no longer needed at all, and was
  deleted along with it.

### Negative
- The `definitions` prop is optional. An editor mounted without one
  typechecks cleanly, renders an empty palette, and throws `Unknown node
  kind` only once something tries to build a node — the compiler cannot
  catch a missing vocabulary the way it once could reject an unknown kind at
  the type level. This is the real cost of the design, not a rounding error:
  during this refactor it silently broke the package's own demo apps and
  storybook, which kept compiling while functionally empty until their call
  sites were converted to pass `definitions` explicitly.

### Risks
- **Risk**: a future host copies an existing `<WorkflowEditor>` usage without
  noticing the `definitions` prop, and ships an editor that renders but does
  nothing.
- **Mitigation**: none at the type level by design — see Negative above. The
  mitigation available is discipline at the call site (every host wires
  `definitions` from `builtinDefinitions` or its own array explicitly) and
  the fact that the failure is loud and immediate — an empty palette and a
  thrown error on the first node — rather than the quiet cross-instance
  vocabulary leakage the singleton risked before ADR-0005.
