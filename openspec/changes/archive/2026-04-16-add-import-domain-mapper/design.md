## Context

The workflow editor already exposes a mount-scoped `runtime` contract that allows consumers to post-process exported workflow domain JSON through `runtime.exportDomain.mapper`. The import path is not symmetric: `importFromJson` calls `parseInternalGraphJson`, which parses JSON and immediately converts the validated domain DTO into `WorkflowGraphState`. After that point the store only performs label deduplication and variable-reference refactors before persisting the imported graph.

This structure makes it impossible for consumers to transform imported domain payloads before they are saved for rendering. The change needs to preserve the existing schema-driven codec behavior, keep runtime configuration mount-scoped and immutable, and avoid exposing internal graph shapes as part of the public extension API.

## Goals / Non-Goals

**Goals:**

- Provide a runtime import hook that mirrors the existing export hook at the domain DTO layer.
- Keep the extension surface on `DomainWorkflowDTO`, not `WorkflowGraphState`.
- Ensure mapper output is validated before conversion to internal graph state.
- Preserve current import behavior when no runtime hook is configured.

**Non-Goals:**

- Replacing the built-in schema validation or internal graph conversion pipeline.
- Adding runtime hooks for clipboard paste/import.
- Changing the label deduplication or variable-reference refactor steps that happen after graph conversion.

## Decisions

### 1. Add `runtime.importDomain.mapper` as the symmetric public API

The runtime contract will gain a new namespaced import hook next to `runtime.exportDomain.mapper`.

Rationale:

- It matches the existing public runtime shape and keeps the extension surface discoverable.
- Consumers can reason about import/export customization as a paired concept.

Alternatives considered:

- Add a top-level `importMapper` prop: rejected because it breaks the runtime namespacing pattern.
- Expose a mapper on `WorkflowGraphState`: rejected because it leaks internal store structure into the consumer API.

### 2. Apply import mapping on validated `DomainWorkflowDTO` before `domainToInternal`

The import pipeline will parse raw JSON into a validated domain DTO, apply `runtime.importDomain.mapper` if configured, revalidate the mapper output, and only then call `domainToInternal`.

Rationale:

- This mirrors the export pipeline, which also maps the domain DTO rather than the internal graph.
- Revalidation protects the store from malformed mapper output while preserving the runtime hook as a safe public extension point.

Alternatives considered:

- Apply mapping after `domainToInternal`: rejected because it couples consumers to internal graph semantics.
- Trust mapper output without revalidation: rejected because runtime hooks are a public integration boundary.

### 3. Split parser responsibilities so the store can access the domain DTO

The parser layer should expose a domain-level parse helper that returns `ParseResult<DomainWorkflowDTO>`. The existing internal-graph parse helper can remain as a convenience wrapper if it is still useful elsewhere, but `importFromJson` should use the domain-level parse result directly.

Rationale:

- Keeps parsing and conversion responsibilities composable.
- Avoids duplicating JSON parsing and domain validation logic inside the store.

Alternatives considered:

- Inject runtime configuration into parser helpers: rejected because parsers should stay stateless and runtime-agnostic.

## Risks / Trade-offs

- [Runtime mapper returns invalid DTO] → Revalidate mapped output and fail import with the existing invalid-schema error path.
- [API surface grows without tests] → Add targeted tests for runtime config exposure and `importFromJson` behavior with and without mapper configuration.
- [Parser API duplication becomes confusing] → Keep one domain-level parse primitive and treat internal parsing as a thin wrapper, or remove the wrapper if unused.

## Migration Plan

This change is backward-compatible. Existing consumers do not need to change anything, because import behavior remains unchanged unless `runtime.importDomain.mapper` is supplied.

If a consumer adopts the new hook, they can incrementally move any ad hoc pre-save normalization logic into the runtime mapper while keeping the built-in schema validation and graph normalization steps intact.

## Open Questions

- Whether `parseInternalGraphJson` should remain exported as a wrapper for convenience or be replaced entirely by a domain-level parse helper in internal call sites.
