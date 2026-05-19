## Context

The active rename work introduced `value` as the canonical scalar workflow type but also kept adapters that accept legacy `string` workflow type metadata. That compatibility layer is not desired: the workflow type system should have one scalar literal, `value`, and any payload still using `string` as a workflow type discriminator should be treated as invalid.

Ordinary JavaScript strings remain valid data. For example, a `value` operand still stores a JavaScript string in its `value` field, and an `array` operand still stores `string[]`.

## Goals / Non-Goals

**Goals:**

- Remove all workflow-type legacy handling for literal `string`.
- Reject `variableType: "string"` in Extractor and Setter configs.
- Reject evaluator operand `type: "string"`.
- Reject runtime evaluator operator catalogs with a `string` group or `allowTypes` entries containing `string`.
- Remove tests that assert `string` workflow type normalization.

**Non-Goals:**

- Rename TypeScript `string` types or ordinary `typeof value === "string"` validation.
- Remove unrelated legacy compatibility for other historical graph shapes, such as old node kinds or inline expression storage.
- Add any migration path from `string` to `value`.

## Decisions

### Reject stale workflow type literals at validation boundaries

Extractor, Setter, Evaluator, and runtime operator catalog validation should accept only `value`, `array`, and `none` where applicable. `string` is not an alias.

Alternative considered: keep accepting `string` only on import but reject it in UI updates. Rejected because it leaves two behaviors for the same invalid payload and makes tests ambiguous.

### Delete normalization adapters instead of hiding them behind helpers

Remove the legacy branches from `normalizeConfigValue`, evaluator operand normalization, and runtime operator normalization. This keeps the canonical model obvious in both implementation and tests.

Alternative considered: keep helper functions but make them reject `string`. Rejected where helpers exist solely for legacy conversion, because dead compatibility paths invite the same ambiguity later.

### Keep data-string validation untouched

Checks that validate actual data values as JavaScript strings should remain. The implementation should only remove `string` when it appears as workflow type metadata.

Alternative considered: broad text replacement. Rejected because it would break legitimate TypeScript and runtime value checks.

## Risks / Trade-offs

- [Risk] Existing saved graphs with workflow type literal `string` will fail import. -> Mitigation: this is the intended strict behavior; callers must emit `value`.
- [Risk] Cleanup may accidentally remove ordinary string validation. -> Mitigation: target only workflow type discriminators, operator catalog keys, `allowTypes`, and related tests.
- [Risk] The previous OpenSpec change still documents legacy normalization. -> Mitigation: update or supersede those active artifacts during implementation so the spec history matches the stricter contract before archive.

## Migration Plan

1. Remove legacy acceptance from variable type validation.
2. Remove evaluator operand `type: "string"` acceptance and normalization.
3. Remove runtime operator catalog `string` group and `allowTypes: ["string"]` normalization.
4. Delete or rewrite tests that assert legacy normalization; add rejection assertions if useful.
5. Update active OpenSpec artifacts that still mention legacy `string` normalization.
6. Run `packages/flow` typecheck and tests.

## Open Questions

- None.
