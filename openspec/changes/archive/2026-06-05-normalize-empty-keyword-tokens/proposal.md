## Why

Clearing a `Keyword` token row can leave the node config with `template: [""]` even though an empty keyword list is semantically represented by `template: []`. This makes persisted workflow state and exported payloads carry a placeholder UI row as real data.

## What Changes

- Normalize committed `Keyword` token rows so empty string entries are not stored in the node config.
- Preserve the current authoring UX where a keyword with no stored tokens still renders one empty editable row.
- Keep valid non-empty literal tokens and single expression tokens persisted in their existing order.
- Update regression coverage for clearing an existing token and for row actions that currently persist empty visual rows.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `keyword-tagged-input`: Keyword token persistence must treat empty rows as UI-only placeholders and store an empty array when no non-empty tokens remain.

## Impact

- `packages/flow/src/workflow/nodes/data/inline-expression/keyword-expression-list-input.tsx`
- `packages/flow/src/workflow/nodes/data/inline-expression/component.test.tsx`
- `openspec/specs/keyword-tagged-input/spec.md` via this change's delta spec
