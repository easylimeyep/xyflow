# ADR-0009: The host owns variable scope

**Date**: 2026-09-22
**Status**: accepted
**Deciders**: flow package maintainers

## Context

The expression catalog answers two questions for every node an author edits:
which nodes produce a variable, and which of those variables this node may
reference. Until now `expression/variables/variables.ts` answered both with
literals of its own.

*Who produces* was a `VARIABLE_NODE_KINDS` set naming four kinds, followed by a
`switch` on `node.data.kind` in `readVariableName()` and a second one in
`readVariableType()`. A host that registered its own kind could not make it
contribute a variable, however faithfully it followed ADR-0005 for everything
else: the palette, the factory, validation and the canvas all honoured its
vocabulary, and autocomplete alone pretended the kind did not exist.

*Who sees* was `getReachableUpstreamNodes()`, a breadth-first walk up the
incoming edges. That encodes one product's execution model — variables resolve
along the wire, so an author may only reference what the graph routes in. It is
not the only model. A backend that resolves variables from a flat per-run
namespace wants every variable on the canvas offered regardless of wiring, and
had no way to say so.

The duplication was already costing correctness rather than merely flexibility.
`readVariableName()` grew a `case "pathExtractor"` branch, but nobody added
`"pathExtractor"` to `VARIABLE_NODE_KINDS`, so the gate rejected the node before
its reader was ever consulted. Path Extractor variables have never reached
autocomplete. Two lists of one fact drifted, silently, and the only signal was a
feature quietly not working.

## Decision

Both questions become injection seams, each owned by whoever can answer it.

**A kind reports its own variable.** `NodeDefinition` gains an optional
`variable?: NodeVariableReader`, called with the node's `id`, `label` and
`config`:

```ts
defineNode({
  kind: "setVariable",
  // ...
  variable: (node) => {
    const name = String(node.config.variableName ?? "").trim()
    if (!name || !isValidJsIdentifier(name)) return null
    return { name, type: node.config.variableType === "array" ? "array" : "value" }
  },
})
```

Declaring the reader is what makes a kind a producer. There is no second list,
so `pathExtractor` is fixed by construction rather than by remembering.

**The editor instance owns scope.** `runtime.variables.scope` takes a
`VariableScopeResolver` — nodes and edges in, candidate node ids out. The
package exports `upstreamScope` (the default, the behaviour described above)
and `graphScope`:

```tsx
<WorkflowEditor definitions={definitions} runtime={{ variables: { scope: graphScope } }} />
```

The seams sit at different levels on purpose. *What does my node produce* is a
property of the kind, so it travels with the definition, exactly as ADR-0006
put the vocabulary on the instance. *Who may see whose variables* is an
editor-wide policy independent of any kind, which is what `WorkflowRuntimeConfig`
already holds for the evaluator catalog and node select options.

**The catalog keeps the invariants a resolver must not be able to break.** It
drops ids it does not recognise, sorts by source label so every resolver yields
a consistently ordered catalog, collapses a name produced by several nodes into
one option whose description names them all, and **always** removes the selected
node from whatever the resolver returned. A self-reference is a cycle, and an
invariant a plugin can opt out of is not an invariant — `upstreamScope` never
reaches the node anyway, `graphScope` would have to remember to filter, and a
host resolver would certainly forget.

**The type tag leaves the contract.** `NodeVariable.type` is an opaque `string`,
not `WorkflowVariableType`. Tracing the consumers found exactly one —
`resolveEffectiveLeftOperandType`, which only ever asks whether the tag is
`"array"` — so the closed union was never the catalog's fact; it is the
evaluator's operand model. The narrowing moved there, where a tag the built-in
evaluator does not recognise resolves to `"value"` *without* being flagged as an
unresolved reference. A host may now emit `"json"` or `"date"` for its own
evaluator to read. `WorkflowVariableType` itself stays, and stays exported: it
is still the vocabulary of `WorkflowTypeSelect` and of the `setVariable` and
`extractor` select fields. It simply stopped being a link in the DI chain.

## Alternatives Considered

### Alternative 1: A `"upstream" | "graph"` enum instead of a resolver
- **Pros**: one string for the host to write; no function to get wrong; trivially serialisable.
- **Cons**: the third algorithm reopens the core. Scope-by-lane, scope-by-subgraph or scope-by-backend-namespace each become a package release rather than a host concern.
- **Why not**: the whole point is that the package stops adjudicating this. An enum moves the list of allowed answers without removing it, which is the mistake `VARIABLE_NODE_KINDS` already made once.

### Alternative 2: A declarative `{ nameKey, typeKey }` descriptor instead of a reader function
- **Pros**: data rather than code; inspectable; no way to write a slow or throwing reader.
- **Cons**: cannot express what the built-ins already do. `pathExtractor` takes its name from the node label, `extractor` falls back from config to label when the config value is not an identifier, and the evaluators validate an identifier before accepting one. Each would need its own escape hatch, and the descriptor would grow into a worse function.
- **Why not**: a shape that cannot describe the package's own five kinds cannot describe a host's.

### Alternative 3: Keep `WorkflowVariableType` as the catalog's type contract
- **Pros**: no change to the evaluator; the union stays checked end to end.
- **Cons**: forbids a host from typing its own variables at all. A kind whose values are JSON documents or dates must either lie (`"value"`) or say nothing.
- **Why not**: it makes the catalog the owner of a vocabulary that belongs to one consumer, which is the same coupling ADR-0005 removed when `NodeKind` stopped being a closed union.

## Consequences

- A host registering a kind can make it contribute to autocomplete by declaring
  one function. Nothing in the package needs to learn the kind exists.
- Scope is chosen per editor instance, for that instance's lifetime. Two
  editors on one page may disagree about it, as they already may about
  vocabulary. It is **not** swappable at runtime: the store reads it once at
  construction and `createContextStore` does not rebuild on a prop change, so a
  host toggling scope must remount. The same is already true of
  `runtime.evaluator`.
- **Path Extractor variables now appear in autocomplete, under both scopes.**
  This is a behavioural change under the default configuration. It is the
  correction of a bug, but a host that built around the absence will see it.
- Under `graphScope` a host can construct a variable reference the backend
  rejects — B reading A's variable with no path from A to B. That is the
  trade the host chose by widening scope; the package still guarantees only
  that a node cannot reference *itself*.
- Variable types now come from the same signature-gated cache as the options
  rather than from a full graph walk per selector call, and both caches are
  built in one pass so they cannot disagree.
- The catalog, the definitions and the scope resolvers can each be understood
  alone. `expression/variables/variable-scope.ts` imports nothing at all.
