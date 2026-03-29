# ADR-0002: Selector layer as read API for UI

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Flow package maintainers

## Context

UI containers and node components were reading broad state slices (`history`, full `nodes`, full `edges`) in places where they only needed a few derived values. This caused unnecessary rerenders and made state access inconsistent across components.

## Decision

We introduce `store/selectors.ts` and treat selectors as the default read API from UI. Components should read only the minimal required derived values; full graph arrays are allowed only in graph/canvas hot paths where needed.

## Alternatives Considered

### Alternative 1: Keep ad-hoc selectors in components
- **Pros**: less upfront structure
- **Cons**: duplicated logic and inconsistent optimization choices
- **Why not**: already caused rerender regressions and drift

### Alternative 2: Auto-generated selectors only
- **Pros**: less boilerplate
- **Cons**: no place for explicit domain-derived selectors
- **Why not**: we need both property selectors and semantic derived selectors

## Consequences

### Positive
- Stable, discoverable state access contracts
- Easier rerender profiling and optimization

### Negative
- Slightly more upfront work when adding new store fields

### Risks
- Selector bloat; mitigate by keeping selectors small and colocated with store domain concerns
