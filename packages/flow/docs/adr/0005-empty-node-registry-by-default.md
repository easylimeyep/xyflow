# ADR-0005: The node registry ships empty

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: flow package maintainers

## Context

ADR-0004 split the registry into focused modules, and a later change made it
extensible: a product registers its own kinds with `registerNodeDefinitions`
and they behave exactly like the package's own.

What it did not change is the baseline. The five definitions the package ships
— `evaluator`, `setVariable`, `inlineExpression`, `extractor`, `result` — were
registered at module scope, so they were the vocabulary of every editor
instance, opt-out only in the sense that there was no way out.

For the package's own demo that is right. For a product it is wrong twice over:

- **The palette lies.** A playbook editor whose engine executes thirteen kinds
  offered eighteen, five of which its backend rejects on save. The author finds
  out after building with them.
- **The default document lies.** `initialWorkflowGraph` seeded an
  `inlineExpression` root — a node the host never asked for, of a kind that
  belongs to the package, in a document the host owns.

## Decision

The registry starts empty. Every kind an editor offers arrives through
`registerNodeDefinitions`.

The built-in definitions are unchanged and still exported; only their
registration moved to the consumer, who asks for them by name:

```ts
registerNodeDefinitions(builtinDefinitions)      // all five
registerNodeDefinitions([evaluator, result])     // or a subset
```

Two consequences follow directly:

- `resetNodeDefinitions()` empties the vocabulary rather than restoring the
  five. Reset means "back to the package baseline", and the baseline is nothing.
- `initialWorkflowGraph` is an empty document, and reads no registry at import
  time. The keyword graph it used to hold is now `createKeywordSampleGraph()`,
  a function because building a node resolves the registry and the registry is
  empty until someone fills it.

`builtinNodeViews` stays the default view map. A view is only ever looked up for
a kind that is registered, so an unused entry costs nothing, and a consumer that
opts into the built-ins gets their bespoke renderers without a second call.

## Alternatives Considered

### Alternative 1: Filter the palette, keep the registry seeded
- **Pros**: one small change; no consumer migration.
- **Cons**: treats a vocabulary problem as a rendering problem. The kinds stay
  live for the node factory, config normalization, validation and paste, so a
  clipboard payload or a stored graph still resurrects them.
- **Why not**: hides the symptom the palette shows while leaving every other
  path that reads the registry wrong.

### Alternative 2: An `excludeBuiltins` prop on the editor
- **Pros**: backwards compatible; the default keeps working.
- **Cons**: the registry is a module-level store and the prop is per-instance,
  so two editors on one page would disagree about what exists. Keeps opt-out as
  the model, which is what produced the problem.
- **Why not**: an opt-out list grows with the package; an opt-in list grows with
  the product, which is the side that should own it.

## Consequences

### Positive
- A product's palette is exactly what its engine can run.
- A fresh document contains only what the host put there.
- The built-in five become an ordinary consumer registration, so the path a
  product takes is the path the package's own demo and stories take.

### Negative
- Every host must register something; an unconfigured editor renders an empty
  palette and an empty canvas.
- The demo app, the storybook preview and the package's own suites gained an
  explicit registration they did not need before.

### Risks
- **Risk**: a host that builds a graph at module scope calls the node factory
  before registering, and gets `Unknown node kind` at import time.
- **Mitigation**: registration is idempotent and cheap, so it belongs at module
  scope in the entry point, above any graph construction. Where import order is
  not obvious — the storybook examples — registration lives in its own module
  that those files import, since an import is evaluated before the body of the
  module importing it.
