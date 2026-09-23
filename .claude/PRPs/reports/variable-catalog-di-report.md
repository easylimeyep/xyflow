# Implementation Report: Dependency injection for the canvas variable catalog

## Summary

Both hardcoded axes of the expression variable catalog became injection seams. A node kind declares the variable it produces through `NodeDefinition.variable`; an editor instance declares who may see whose variables through `runtime.variables.scope`. A host can now offer every variable on the canvas (`graphScope`) instead of only the upstream ones, and can make its own kinds participate in autocomplete. The `pathExtractor` bug — a reader that existed but was gated out by a stale kind list — is fixed by construction.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium | Medium — as scoped |
| Confidence | 8/10 | Justified; the one miss was caught by typecheck, not by review |
| Files Changed | 21 (2 created) | 20 (3 created) |
| Tasks | 10 | 10, plus one unplanned test file |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Producer contract on `NodeDefinition` | Complete | |
| 2 | Scope resolver module | Complete | Dependency-free as designed |
| 3 | Rewrite the catalog | Complete | Two functions collapsed into one pass |
| 4 | Move five readers onto definitions | Complete | Evaluators share `readEvaluatorVariable` |
| 5 | Inject resolver through runtime | Complete | Non-function input degrades to default |
| 6 | Rewire store caches | Complete | Six slice call sites untouched, as predicted |
| 7 | Narrow the tag inside the evaluator | Complete | Two-case distinction preserved |
| 8 | Public exports | Complete | |
| 9 | Rewrite catalog tests | Complete | 13 ported, 14 added |
| 10 | ADR-0009 + index | Complete | |
| — | Store-level injection test | Added | Not in the plan; see Deviations |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | Pass | 6/6 typecheck tasks clean |
| Lint | Pass | 0 errors; warning counts unchanged from baseline |
| Unit Tests | Pass | 490 in `flow` (was 485), 48 files |
| Build | Pass | 2/2 |
| Decoupling check | Pass | `variable-types` absent from `expression/`; `VARIABLE_NODE_KINDS` gone from `src/` |
| Coverage | Pass | 87.46% overall vs 70% threshold; `variables.ts` at 100% |

## Files Changed

| File | Action |
|---|---|
| `expression/variables/variable-scope.ts` | CREATED |
| `store/variable-scope-injection.test.ts` | CREATED |
| `docs/adr/0009-the-host-owns-variable-scope.md` | CREATED |
| `expression/variables/variables.ts` | REWRITTEN (+91 / −158) |
| `expression/variables/variables.test.ts` | REWRITTEN |
| `expression/variables/index.ts` | UPDATED |
| `node-registry/define-node.ts` | UPDATED |
| `nodes/data/{set-variable,extractor,path-extractor}/definition.ts` | UPDATED |
| `nodes/logic/evaluator-shared/{config.ts,operands.ts,condition-row.tsx}` | UPDATED |
| `nodes/logic/{evaluator,json-evaluator}/definition.ts` | UPDATED |
| `store/{types,runtime,expression-deps,selectors,store}.ts` | UPDATED |
| `store/slices/expression-slice.ts` | UPDATED |
| `src/index.tsx` | UPDATED |
| `docs/adr/README.md` | UPDATED |

## Deviations from Plan

1. **Added `store/variable-scope-injection.test.ts` (5 tests).** The plan tested the catalog in isolation, which left the seam a host actually touches — `runtime.variables.scope` reaching the cache through `createWorkflowStore` — unverified. Covers: `graphScope` surfacing a disconnected producer, the default hiding it, the types cache, both caches rebuilding together on a rename, and a non-function scope degrading to the default.

2. **Test helpers `node()`, `connect()`, `names()` in the catalog tests.** The original file repeated a seven-line edge literal thirteen times; threading two more arguments through each would have pushed it past 700 lines. Node construction, config mutation and assertion style are unchanged — only the boilerplate is factored out.

3. **`normalizeVariableScope` guards `typeof scope === "function"`.** Anticipated in the plan's Task 5 GOTCHA rather than its implementation text; implemented and tested.

## Issues Encountered

1. **`WorkflowGraphState` requires a `document` field.** The new store test omitted it. Vitest does not typecheck, so all 490 tests passed while `pnpm typecheck` failed — the failure surfaced only in the full validation run. Fixed by supplying the document literal.

2. **`pnpm format` reformatted four unrelated files** that were already drifted from Prettier on `master` (`path-extractor/component.tsx` and its test, `json-evaluator/definition.test.ts`, `apps/web/next-env.d.ts`). Reverted to keep the diff scoped. Worth noting separately: `master` is not Prettier-clean.

3. **`WorkflowVariableType` left unused in `condition-row.tsx`** after the prop type widened. Removed; lint would otherwise have gained a warning.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `expression/variables/variables.test.ts` | 27 | Producer discovery, scope injection, self-exclusion (incl. hostile resolver), duplicate collapsing, type-tag transit, both shipped resolvers |
| `store/variable-scope-injection.test.ts` | 5 | Runtime injection end to end, cache coherence, malformed-input fallback |

## Behavioural Change to Flag

Path Extractor variables now appear in autocomplete under **both** scopes, including the default. This corrects a bug that has always been present, but a host that built around the absence will observe the difference. Recorded in ADR-0009 Consequences.

## Next Steps

- [ ] Code review via `/code-review`
- [ ] Commit and open a PR

---

# Code Review Round 1

Reviewed by a separate `code-reviewer` subagent (Opus) against the five invariants the design claimed. Every finding was independently verified before acting.

## HIGH — 1 found, fixed

**An untyped producer squatted the type slot, silencing a typed one.** `readEvaluatorVariable` returns `{ name }` with no `type`. In duplicate collapsing the first source by label owned `type` unconditionally — including when it was `undefined` — and the `if (existing)` branch gave later sources no way to fill it.

Verified as a **regression against master**: there, the `if (!variableType) return` guard stopped an evaluator from reserving the key at all, so a later `setVariable` with the same name did record its tag.

Failure: evaluator `"A Check"` (`config.label = "flag"`) plus setVariable `"B Setter"` (`variableName = "flag"`, `variableType = "array"`). `"A Check"` sorts first, `types.flag` ends up absent, and `resolveEffectiveLeftOperandType` reports `unresolvedVariableName` — a live variable rendered as a broken reference, with array operators cut off.

Fixed with `existing.type ??= variable?.type`, after first writing a failing test (`expected undefined to be 'array'`). The pre-existing "first source in label order" test masked the bug: both its sources carry a tag.

## MEDIUM — 3 found, 2 fixed, 1 partially

| Finding | Resolution |
|---|---|
| `config` handed to host code by reference to live store state | Fixed — `Readonly<Record<string, unknown>>` on `NodeVariableSource.config` and `VariableScopeNode.config` |
| Scope projection rebuilt per node → O(n² + n·e) wrapper allocations | Fixed — `createWorkflowVariableCatalogBuilder` hoists the projection and id index. **Measured** on the 180-node graph from `store.performance.test.ts`: 14.1 → 11.6 ms upstream, 12.8 → 10.2 ms graph (~18%). A real gain on a real path, though see the correction below on how often that path actually runs |
| A resolver that throws crashes the store, though the comment promised degradation | Partially — fail-loud kept deliberately (a silently emptied catalog sends the author hunting for a missing variable instead of a stack trace). The comment was rewritten to claim only what it does: it guards the config's **shape**, since a function cannot survive deserialisation from a server |

## LOW — 4 found, 4 addressed

| Finding | Resolution |
|---|---|
| `EMPTY_CATALOG` a shared mutable object | Removed the constant entirely; the empty path returns a fresh literal. Simpler than freezing and needs no casts |
| Label-order tie-break non-deterministic (equal labels fall back to traversal order) | Secondary sort by `node.id`, plus a test feeding the same nodes in two orders |
| `runtime.variables.scope` not swappable after mount | Verified: `createContextStore` uses `useState(() => factory(...))`, so the store is never rebuilt on a prop change. ADR-0009 wording corrected to "per instance lifetime", noting `runtime.evaluator` behaves the same |
| `?? {}` on a cache miss returns a fresh reference | `EMPTY_VARIABLE_OPTIONS` / `EMPTY_VARIABLE_TYPES` constants; the sibling selector's inherited `return []` cleaned up too |

## Invariants

All five hold. Self-exclusion was confirmed to sit before the `nodesById` lookup, so no resolver can route around it — including `upstreamScope` itself, which can return `nodeId` on a cyclic graph.

## Known ceiling — accepted, not fixed

Under `graphScope` the catalog is identical for every node but self-exclusion, yet it is computed n times. The structural signature includes each node's whole config, so editing any field of any node rebuilds every cache — even a field no variable reader looks at.

Not addressed. Computing once and subtracting self is not a subtraction — removing a node can change a group's source list, its description and its tag owner, so the fast path would need its own regrouping logic and its own correctness argument. After the builder fix the rebuild is ~10 ms on 180 nodes; revisit if `perf-budget.md` starts flagging it.

## Mistakes made during this round

1. The tie-break test as first written created **fresh nodes with new random ids** for each ordering, so it compared two different graphs and failed. Caught by running it.
2. `Object.freeze` on the empty catalog produced `readonly` types incompatible with the mutable interface; resolved by dropping the shared object rather than casting around it.

## Final state

typecheck 6/6 · lint 0 errors · 492 tests · build 2/2

---

# Code Review Round 2

The reviewer audited the round-1 fixes themselves. Both findings were in code written during round 1, not in the original implementation.

## MEDIUM — a blank tag fell between two definitions of "reported a tag"

The round-1 fix `existing.type ??= variable?.type` tests **nullish**, while the emit `if (sources.type)` tests **truthy**. A blank tag falls between them.

The reviewer described `""`: it claims the slot (not nullish, so `??=` blocks later sources) and is then discarded at emit. A test with `type: "  "` showed worse — whitespace is truthy, so it is **emitted as the variable's type**: `expected '  ' to be 'array'`. The evaluator then reads it as an unknown tag and silently resolves to `"value"`.

Same bug class as the one round 1 fixed, different trigger. Fixed by having a single definition at the read boundary:

```ts
const reportedType = variable?.type?.trim() ? variable.type : undefined
```

used for both the slot claim and the initial write, with `!== undefined` as the only test at emit. The tag is stored as received — it is opaque, so host data is not mangled; only the "is it reported" predicate trims.

## MEDIUM — the shared projection was mutable by host code

`createWorkflowVariableCatalogBuilder` builds `scopeNodes` / `scopeEdges` once and passes the same arrays and the same elements to `scope(...)` on every node of a rebuild. `readonly` on `VariableScopeInput` is compile-time only.

A resolver shaped as "sort, then take the nearest k" — not exotic — would reorder the array in place, and every node walked later **in the same rebuild** would see the altered graph. Verified the amplifier: `projectExpressionDeps` sorts a copy by id (`expression-deps.ts:54`), but `buildExpressionCaches` iterates `graph.nodes` in original order (`expression-deps.ts:167`), so iteration order is outside the structural signature and a rebuild would not clear the corruption.

Not a regression against master, which had no DI seam at all — a new blast radius introduced by the builder, and the same class as the shared empty catalog closed in round 1. The difference: the empty catalog went to our own code, the projection goes to someone else's.

Fixed by freezing both arrays **and their elements** — freezing only the arrays would still permit rewriting a wrapper's `label`. Statement-by-statement, so the types stay mutable and no casts are needed. Cost is O(n + e) once per rebuild against O(n²) traversal work: negligible. A test now asserts a resolver can neither `sort()` nor rewrite an element.

Also closed a related risk the reviewer raised in passing: `EMPTY_VARIABLE_OPTIONS` / `EMPTY_VARIABLE_TYPES` go out by reference to every component hitting an empty catalog, so they are frozen too.

## Accepted without change

The second `graphScope` optimisation — computing the catalog once and sharing it — was argued down by the reviewer and I agree: it would need either an opt-in flag on the resolver ("my answer does not depend on `nodeId`") or memoisation by serialised id set, both of which complicate the seam for one built-in resolver, and neither helps `upstreamScope`, which is the default.

More useful was the reviewer's point that the cost driver is the **gate**, not the traversal: `normalizeConfigForSignature` (`expression-deps.ts:26`) puts each node's entire config into the structural signature, so editing any field of any node rebuilds every cache. Narrowing the signature to the keys that actually affect the catalog would be the real fix.

### Correction: the rebuild is per commit, not per keystroke

The reviewer characterised this as firing on "every keystroke", and round 1 of this report repeated that without checking. It is wrong, and the correction matters because it changes the severity.

Every text field in the editor holds a draft in local state and commits to the store on blur or Enter:

| Site | Mechanism |
|---|---|
| `nodes/shared/use-variable-identifier-field.ts:33,79,97` | `draftValue` in `useState`; `commit()` from `onBlur` and Enter |
| `nodes/data/path-extractor/component.tsx:51,55` | `draftPath` + `commitPath` on blur |
| `nodes/data/inline-expression/component.tsx:87` | UI says so outright: "Press Enter or blur to commit one history step" |
| `packages/expression-editor/src/types.ts:8` | `ExpressionCommitReason = "blur" \| "enter" \| "variable-insert"` |

Checkboxes and selects commit on a single interaction. So the rebuild runs tens of times across an editing session, not thousands. At the measured 10–11 ms on 180 nodes this is not the interactivity problem it was described as.

What survives is the granularity point, not the frequency one: the signature reacts to any config key on any node, while only a handful affect the catalog. Editing `path` on a Path Extractor is a wasted full rebuild — `pathExtractor.variable` reads only `node.label` and `config.outputType`, never `path`. Same for `tokenNumber` / `unlimited` on Extractor and `caseSensitive` / `repeatable` on Inline Expression.

**Recommendation: do not pursue this.** The keys a `variable` reader touches are not declared anywhere — the reader is a function — so narrowing the signature would mean adding a key list to `NodeDefinition` beside the reader. That reintroduces two sources of truth for one fact, which is precisely what this branch removed. Given the corrected frequency, the payoff does not justify the regression in design.

Behaviour inherited from master and unchanged by this branch.

## Final state

typecheck 6/6 · lint 0 errors · 494 tests · build 2/2
