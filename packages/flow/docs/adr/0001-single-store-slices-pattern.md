# ADR-0001: Keep one Zustand store with slices pattern

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Flow package maintainers

## Context

`packages/flow` had a single large `store.ts` where graph actions, UI intents, history, clipboard I/O, and validation concerns were implemented together. This created a maintenance bottleneck and made the store difficult to reason about as the feature set grew.

## Decision

We keep a single Zustand store, but split implementation into slice creators (`graph`, `selection`, `intent`, `history`, `io`) and compose them in `createWorkflowStore`.

## Alternatives Considered

### Alternative 1: Multiple independent stores
- **Pros**: strict ownership per domain
- **Cons**: cross-store workflow operations become harder and more brittle
- **Why not**: editor operations need atomic updates across concerns

### Alternative 2: State machine rewrite
- **Pros**: explicit transitions for complex flows
- **Cons**: large migration cost and higher cognitive load for current team
- **Why not**: not required for current scope; slices solve the immediate scaling issue

## Consequences

### Positive
- Better separation of responsibilities while keeping one source of truth
- Easier test targeting for individual areas of behavior

### Negative
- Requires discipline to keep boundaries clean over time
- Some operations still coordinate across slices

### Risks
- Slice boundaries can drift; mitigate with ADR + tests + code review checklist
