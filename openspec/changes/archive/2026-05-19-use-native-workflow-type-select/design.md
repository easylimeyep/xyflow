## Context

Workflow variable and operand type controls currently use `WorkflowTypePicker`, a compact icon button that opens a custom popover. The UI shape is efficient inside nodes, but the interaction duplicates behavior that native `<select>` already provides for keyboard users, assistive technology, and mobile platform pickers.

The project already has a shadcn-style `NativeSelect` component in `packages/ui`, and `packages/flow` already uses it for Result and Evaluator operator selects. The new type control can reuse that primitive while keeping workflow-specific icon rendering in `packages/flow`.

## Goals / Non-Goals

**Goals:**

- Keep the collapsed type control visually compact and icon-first.
- Use a real native select as the interactive element.
- Preserve `value` and `array` labels and persisted config values.
- Support allowed-type filtering for evaluator right operands.
- Keep the implementation local to workflow type selection instead of changing every native select.

**Non-Goals:**

- Do not add a new UI dependency.
- Do not change workflow config schema, import/export behavior, or runtime semantics.
- Do not attempt to render icons inside native option dropdown rows.
- Do not redesign the surrounding node layout beyond the sizing needed for the compact native select.

## Decisions

### Decision: Add a workflow-specific native type select component

Create a small `WorkflowTypeNativeSelect` component in `packages/flow` that composes `NativeSelect` and `NativeSelectOption`. It owns the mapping from workflow variable type to icon:

- `value` uses the existing scalar/value icon.
- `array` uses the existing array icon.
- Options remain text labels: `value` and `array`.

Alternative considered: add an icon-only variant directly to `NativeSelect`. That would make the shared UI primitive aware of a specialized collapsed-content pattern that is currently only needed for workflow type controls. Keeping the wrapper in `packages/flow` keeps the shared component simpler.

### Decision: Make the select itself the clickable control

The compact visual control should be a native select, not a button that imperatively opens another hidden select. The wrapper can visually overlay the selected type icon while the `<select>` retains focus, click, change, and keyboard behavior.

Alternative considered: keep a button and trigger a hidden select. Native select opening is browser-controlled and not consistently exposed through imperative APIs, so that path is fragile and less accessible.

### Decision: Replace all workflow type picker usages together

Replace the Extractor, Setter, and Evaluator operand type controls in one pass. This avoids two competing type-control interaction models for the same domain concept.

Alternative considered: migrate only Extractor and Setter first. The evaluator already depends on the same allowed type semantics, so leaving it on the popover picker would preserve inconsistency and keep the old component alive.

## Risks / Trade-offs

- [Risk] Native option dropdown rows cannot include custom icons consistently across browsers. -> Mitigation: show icons only in the collapsed control and keep native option text as `value` and `array`.
- [Risk] Hiding the selected text visually could reduce accessibility if done with display tricks. -> Mitigation: keep the native select labeled with `aria-label`, expose text options normally, and treat the icon as decorative.
- [Risk] Compact select sizing may differ slightly from the old icon button. -> Mitigation: align dimensions with existing icon button sizes and cover Extractor, Setter, and Evaluator layout in component tests.
- [Risk] Evaluator right operand type filtering could regress during the component swap. -> Mitigation: keep `allowedTypes` as an explicit prop and update existing tests to assert native select options.
