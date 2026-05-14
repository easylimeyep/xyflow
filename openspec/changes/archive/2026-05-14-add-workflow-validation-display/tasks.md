## 1. Validation Types And Store

- [x] 1.1 Add exported workflow validation types for severity, global messages, node messages, and validation snapshots.
- [x] 1.2 Add validation state to the workflow store outside `WorkflowGraphState` and history.
- [x] 1.3 Implement validation normalization with global messages, node messages grouped by node id, and stable message keys.
- [x] 1.4 Implement `setValidation` so `null` clears validation, a repeated revision preserves local hidden state, and a new revision replaces server validation and clears local hidden state.
- [x] 1.5 Add selectors for visible global validation messages, visible node validation messages, and node validation presence.

## 2. Local Validation Hiding

- [x] 2.1 Hide validation for a node when its config changes.
- [x] 2.2 Hide validation for a node when its label changes.
- [x] 2.3 Hide validation for touched nodes when edges are added or removed.
- [x] 2.4 Hide global validation when graph structure changes through edge changes, node add, node duplicate, node delete, or import.
- [x] 2.5 Ensure new server validation revisions clear locally hidden validation state and can show messages again.

## 3. Editor Integration

- [x] 3.1 Add `validation?: WorkflowValidationSnapshot | null` to `WorkflowEditorProps`.
- [x] 3.2 Add a small `WorkflowValidationSync` component that syncs the prop into the workflow store with `useEffect`.
- [x] 3.3 Export validation types from the package entrypoint.
- [x] 3.4 Keep validation changes out of undo/redo, clipboard, duplicate, and domain/backend export paths.

## 4. Global Validation UI

- [x] 4.1 Add a workflow validation alert component that renders visible global messages with the existing `Alert` component.
- [x] 4.2 Place the global validation alert in the default editor composition separately from `EditorToolbar` transient status.
- [x] 4.3 Support multiple global messages without hiding the first message behind interaction.
- [x] 4.4 Verify the alert disappears when validation is cleared or all global messages are locally hidden.

## 5. Node Validation UI

- [x] 5.1 Extend `NodeShell` styling with a destructive validation visual state that composes with selected state.
- [x] 5.2 Add a compact validation affordance to node headers for nodes with visible validation.
- [x] 5.3 Expose node validation messages through a tooltip or popover without mutating node data.
- [x] 5.4 Ensure messages for unknown node ids do not crash rendering or attach to unrelated nodes.
- [x] 5.5 Keep node validation text out of default inline node body layout to avoid disruptive canvas layout shifts.

## 6. Examples And Documentation

- [x] 6.1 Add a lightweight example showing TanStack Query-style polling that passes `validationQuery.data` into `WorkflowEditor`.
- [x] 6.2 Add a lightweight example showing stream updates writing validation snapshots into a query cache before rendering `WorkflowEditor`.
- [x] 6.3 Include an example validation payload with global and node-level messages, including `revision`, `workflowVersion`, and `fieldPath`.

## 7. Tests And Verification

- [x] 7.1 Add store tests for validation normalization, repeated revision behavior, new revision behavior, and `null` clearing.
- [x] 7.2 Add store tests for local hiding after node config, node label, edge, node collection, and import changes.
- [x] 7.3 Add component tests for global Alert rendering and separation from transient editor status.
- [x] 7.4 Add node rendering tests for destructive node state, multiple messages, selected-state composition, and unknown node ids.
- [x] 7.5 Run package-level typecheck and targeted workflow tests.
