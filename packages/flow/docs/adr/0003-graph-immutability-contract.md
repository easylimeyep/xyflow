# ADR-0003: Graph immutability and history snapshot contract

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Flow package maintainers

## Context

History correctness depends on safe graph snapshots. The previous implementation had mixed update styles and an unreachable fallback clone path, which made the immutability contract harder to understand.

## Decision

We keep a single explicit clone strategy (`cloneGraphState`) for history commits and replace-present operations. Structural commits always snapshot cloned graph state. Transient updates are allowed to avoid extra history churn but must not mutate previous snapshots.

## Alternatives Considered

### Alternative 1: Clone deeply on every update
- **Pros**: safest mental model
- **Cons**: unnecessary runtime cost on transient updates
- **Why not**: expensive for drag-heavy interactions

### Alternative 2: No cloning, rely on discipline
- **Pros**: fastest writes
- **Cons**: high risk of undo/redo corruption via accidental shared references
- **Why not**: unsafe for long-term maintainability

## Consequences

### Positive
- Clear contract around history safety
- Easier to reason about undo/redo and regression tests

### Negative
- Clone cost still exists on commit paths

### Risks
- Accidental mutable operations in transient paths; mitigate with tests around history invariants
