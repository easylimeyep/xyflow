## Context

Both built-in evaluators branch through the `evaluator-true` / `evaluator-false` handles, and
`isBranchingKind` answers "does this kind branch" from a fixed set in `types/branching.ts`. The
one-target-per-branch rule was enforced in four independent places: connection validation, the two
quick-add store commands, the quick-add affordance, and strict backend export — each testing
branching alone, so the rule could not differ between the two evaluators.

The package's rule since ADR-0004/0006 is that a kind's behaviour comes from the definition the host
hands the editor, and every layer that resolves a kind is handed that registry. The variable catalog
(`NodeDefinition.variable`) is the most recent example: "there is no second list of producing kinds
to keep in step with it".

## Goals / Non-Goals

**Goals:**
- One definition-level switch that every consumer of the rule reads, so the plain Evaluator is
  untouched by construction rather than by a kind check.
- A host can flip the switch for either evaluator without forking the package.

**Non-Goals:**
- Moving branching itself (`isBranchingKind`, the handle ids) onto the definition. Useful later, not
  needed for this change.
- Validating branch cardinality on paste or domain import; neither validated it before.
- A backend import parser; the package only exports.

## Decisions

**The switch is `NodeDefinition.multipleBranchTargets`, read through
`allowsMultipleBranchTargets(registry, kind)`.** It sits next to `getAllowedTargets` in
`node-graph-rules.ts`, the module that already answers connection-rule questions from a registry.
It answers `true` only for a branching kind that declares the flag, so an unregistered kind, or a
flag set on a non-branching kind, falls back to one target per branch.
*Alternative — a `Set` of fan-out kinds in `branching.ts`:* rejected. It is exactly the second list
the registry exists to avoid, and a host could not change it.
*Alternative — a per-handle `maxConnections` on `OutputHandle`:* more general, but nothing needs a
limit other than one or unlimited, and it would make every consumer compare edge counts to a number.

**Quick-add asks one function, `isOutputSaturated`.** The two store commands and the affordance
shared the rule, so it lives beside `hasOutgoingConnection` in `store/collection-diff.ts`. It checks
edges first and resolves the source kind lazily through a callback, so the affordance selector —
which runs for every output on every store update — only looks a node up when its output is already
connected.
*Alternative — thread the kind through `NodeShell` into the affordance:* avoids the lookup
entirely, but touches every renderer that draws a `NodeShell`. Deferred until profiling asks for it.

**Backend export takes the registry as its first argument.** The serialized shape now depends on the
kind's definition, and the export functions are pure, so the registry has to be passed in. First
position matches `validateConnection(registry, …)` and `exportDomainDto(registry, …)`. Hosts get it
from `useNodeRegistry()` inside the editor or `createNodeRegistry(definitions)` outside.
*Alternative — an optional argument defaulting to single-target:* keeps the old signature, but a
host that forgets it silently truncates a JSON Evaluator's branches in drafts. Required is safer.

**The DTO is a union discriminated by shape, not by kind.** `BackendSingleTargetEvaluatorWorkflowNodeDTO`
and `BackendMultiTargetEvaluatorWorkflowNodeDTO` both allow either evaluator `kind`, because a host
may flip the flag on either. `isMultiTargetEvaluatorDTO` (`Array.isArray(next_true)`) is the guard.
Multi-target branches export `[]` when unconnected, never `null`, so the backend has one type per
field.

**Layout: shortcut clearance only counts the opposite branch as a sibling.** With fan-out, several
edges can leave the shortcut's own branch; those share its lane. For a single-target evaluator the
two sets are identical, so its layout does not change.

## Risks / Trade-offs

- [A host passes a stale registry, or one without `jsonEvaluator`] → the kind reads as
  single-target: strict export throws "duplicate branch connections", and draft export keeps only
  the last target of each branch. Accepted: throwing on an unregistered branching kind would also
  reject graphs that export fine today. The signature makes the dependency explicit.
- [Breaking public API] → the export signature and the evaluator DTO type change. Called out in the
  proposal; the only in-repo caller (Storybook) is updated. Needs a changelog entry and version bump
  on release.
- [A fan-out branch's quick-add line overlaps its existing edge] → cosmetic; revisit with a
  hover-only affordance if it reads badly.
- [Same-branch sibling that also reaches the shortcut target gets no clearance] → possible edge
  overlap on unusual fan-out graphs; covered by ELK routing, and the old behaviour for single-target
  evaluators is unchanged.

## Migration Plan

Hosts update their calls to `exportDomainWorkflowForBackend(registry, dto)` /
`exportDraftDomainWorkflowForBackend(registry, dto)`, and code reading `next_true` / `next_false`
narrows with `isMultiTargetEvaluatorDTO`. The backend accepts list-shaped branches for
`jsonEvaluator` before this ships. Rollback is a revert: persisted domain documents are unchanged,
only the backend DTO shape differs.
