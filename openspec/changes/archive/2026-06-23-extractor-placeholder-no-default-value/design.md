## Context

The `extractor` node field currently initializes with a non-empty default `value`. This behavior conflicts with the desired UX where new nodes start empty while still guiding users via input hints. The change is localized to `packages/flow` node configuration and related tests.

## Goals / Non-Goals

**Goals:**
- Initialize the `extractor` field with an empty value instead of persisted default content.
- Provide a clear `placeholder` string in the UI for first-time guidance.
- Keep existing serialization and user-entered data behavior unchanged.
- Update tests that currently assert the old default value behavior.

**Non-Goals:**
- Redesigning the extractor node form layout.
- Changing runtime extraction logic or backend payload format.
- Introducing new node types or global form primitives.

## Decisions

- **Store empty default in node data**
  - Decision: Set the extractor field default to an empty string (or undefined if current convention prefers omission) in node default data.
  - Rationale: Ensures created nodes are semantically empty and avoids treating example text as real user input.
  - Alternative considered: Keep current default `value` and only visually style it like placeholder. Rejected because the value would still be persisted/exported unless manually removed.

- **Render hint via placeholder prop**
  - Decision: Supply guidance text through the input component's `placeholder` instead of initial `value`.
  - Rationale: Placeholder communicates intent without mutating saved data.
  - Alternative considered: Tooltip/help text only. Rejected because it is less discoverable than inline placeholder.

- **Adjust tests at behavior boundary**
  - Decision: Update unit tests to assert empty initial value and presence of placeholder-facing behavior where applicable.
  - Rationale: Locks in UX contract and prevents regressions that reintroduce default content.
  - Alternative considered: Snapshot-only updates. Rejected because explicit assertions are clearer for this behavior.

## Risks / Trade-offs

- **[Risk] Placeholder text can be interpreted as actual value in tests** -> **Mitigation:** Add assertions that saved/exported node data remains empty until user input is provided.
- **[Risk] Existing tests may rely on old defaults across mapper/store layers** -> **Mitigation:** Update affected tests in the same change and verify suite pass for workflow-related modules.
- **[Trade-off] Users lose example starter text** -> **Mitigation:** Use concise, action-oriented placeholder copy that preserves guidance without persistence side effects.
