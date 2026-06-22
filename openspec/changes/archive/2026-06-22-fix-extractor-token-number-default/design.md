## Context

Extractor node config is created through `buildDefaultConfig()` in the node definition and copied into the Zustand store when a node is added from the palette. The Extractor UI reads `config.tokenNumber` but normalizes display with `Math.max(1, Math.trunc(config.tokenNumber))`, so a stored `0` renders as `1`.

Because Token Number uses commit-on-blur, a fresh node that the author never edits keeps `tokenNumber: 0` in the store. Backend export (`exportDomainWorkflowForBackend`) copies node config verbatim, so Transform logs `0` while the canvas shows `1`.

Option A fixes the mismatch at the source of truth: the node definition default.

## Goals / Non-Goals

**Goals:**

- Ensure newly created Extractor nodes persist `config.tokenNumber` equal to `1`.
- Keep UI, domain export, and backend export aligned without requiring user interaction.
- Update focused regression coverage for the new default.

**Non-Goals:**

- Migrating or rewriting existing saved workflows that already store `tokenNumber: 0`.
- Changing Keyword token placeholder behavior or Setter value-expression commit semantics.
- Adding `normalizeConfigValue` coercion for imported `0` values.
- Removing the UI display clamp or altering Token Number validation rules in this change.

## Decisions

### Change `buildDefaultConfig` default from `0` to `1`

Update `packages/flow/src/workflow/nodes/data/extractor/definition.ts` so `tokenNumber: 1`.

Rationale: this is the smallest fix and matches what authors already see in the UI, what demo graphs use, and what backend-export tests expect when they set explicit values.

Alternative considered: auto-commit normalized display value on mount. Rejected because it adds hidden side effects and still leaves the definition default inconsistent.

Alternative considered: `normalizeConfigValue` mapping `0 → 1` on import. Rejected for this change because it broadens scope beyond new-node creation and may surprise authors who intentionally stored `0` in legacy payloads.

### Leave Extractor UI clamp in place

Keep `Math.max(1, …)` in `component.tsx` so invalid or legacy stored values below `1` still render safely.

Rationale: the default fix removes the common case; the clamp remains a defensive display guard without changing persisted values on render.

## Risks / Trade-offs

- [Risk] Existing workflows with `tokenNumber: 0` remain `0` until edited. → Mitigation: acceptable for this scoped fix; import normalization can be a follow-up if needed.
- [Risk] Tests asserting default `0` for new extractor nodes will fail. → Mitigation: update extractor definition, registry, clipboard, and initial-graph tests to expect `1`.
- [Risk] Backend/runtime semantics may treat `0` and `1` differently. → Mitigation: UI and demos already assume `1` as the practical default; this change makes persistence match that assumption.
