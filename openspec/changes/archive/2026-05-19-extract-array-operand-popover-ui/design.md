## Context

The evaluator node currently defines `ArrayOperandPopover` inside `packages/flow/src/workflow/nodes/logic/evaluator/component.tsx`. That component renders a reusable compact array editor, but it also owns workflow behavior: Radix popover open state, draft array state, operand normalization, equality checks, commit-on-close, and construction of `WorkflowTypedValue` payloads.

`packages/flow` has a project rule to avoid importing shared `cn` helpers and to compose flow component classes through `tv`. `packages/ui` already owns generic primitives such as `Button`, `Badge`, `Input`, and `Popover`, and its components conventionally use `cn`/`cva` internally. The extraction should respect both package boundaries.

## Goals / Non-Goals

**Goals:**

- Introduce a reusable dumb array input popover component in `packages/ui`.
- Keep evaluator-specific state, normalization, and commit semantics in `packages/flow`.
- Preserve the existing evaluator array operand UX and test-covered behavior.
- Reduce direct primitive imports in the evaluator node that are only needed by the array popover UI.

**Non-Goals:**

- Change evaluator config shape, runtime matching semantics, or operator catalogs.
- Change expression input behavior for scalar value operands.
- Add drag-and-drop or reordering to array operand rows.
- Broaden the array editor into a schema-aware form field beyond string arrays.

## Decisions

### UI component is controlled and workflow-agnostic

Create a `packages/ui` component that renders the popover from plain values and callbacks, for example `ArrayInputPopover`. It should accept `open`, `values`, `label`, `placeholder`, optional `previewLimit`, `onOpenChange`, and value mutation callbacks or a single `onValuesChange`.

Rationale: the UI package should not import `WorkflowTypedValue`, know evaluator operator rules, or decide when drafts commit to node config. A controlled API also makes the component usable by future callers with different commit timing.

Alternative considered: move the existing component wholesale into `packages/ui`. That would leak workflow operand types and commit semantics into the UI package, preserving the coupling this change is meant to remove.

### Workflow wrapper owns draft and commit behavior

Keep a small workflow-aware adapter in the evaluator implementation. The adapter should translate an array `WorkflowTypedValue` into controlled UI props, manage draft values while the popover is open, normalize empty arrays according to evaluator behavior, and call `onChange(createArrayOperand(...))` only when closing with changed values.

Rationale: the evaluator currently has intentional behavior where edits are visible in the open preview but are not committed to node config until the popover closes. That behavior is part of the workflow editor, not part of a generic UI primitive.

Alternative considered: commit each row edit immediately. That would simplify state but would change existing behavior and increase node config churn during typing.

### UI styles move with the UI component

Move array-popover-specific slot classes out of `evaluatorNodeStyles` and into the new UI component using the existing `packages/ui` styling conventions. The evaluator may still pass `className` or targeted class override props if needed, but it should not own the internal chip/list/input/delete button layout.

Rationale: leaving these slots in `packages/flow` would keep the visual structure split across packages and make the UI component less reusable.

Alternative considered: expose every internal class slot as required props. That would keep flow styling control but make the component noisy and too tied to one caller.

### Tests split by ownership

Evaluator tests should continue verifying workflow behavior: draft edits do not call `updateNodeConfig` until close, final operands are committed correctly, and existing operand type switching behavior still works. UI tests should cover rendering and callback mechanics for preview chips, overflow, placeholder, add, delete, and input changes without relying on evaluator node setup.

Rationale: splitting tests along ownership keeps regressions easy to localize after extraction.

Alternative considered: rely only on existing evaluator tests. That would cover the integrated behavior but leave the new reusable UI contract implicit.

## Risks / Trade-offs

- Controlled API prop surface grows beyond the current inline component -> Mitigation: keep the first version narrowly scoped to string-array editing and use sensible defaults like `previewLimit = 3`.
- Styling can drift during extraction -> Mitigation: port the current class strings directly before any visual refinement and verify existing tests plus a browser check if implementation changes visible UI.
- Commit-on-close behavior can accidentally move into the UI component -> Mitigation: name workflow adapter responsibilities explicitly and keep UI callbacks low-level.
- Tests may become brittle around popover portals -> Mitigation: keep evaluator tests focused on accessible labels and user-observable output, mirroring the current test style.
