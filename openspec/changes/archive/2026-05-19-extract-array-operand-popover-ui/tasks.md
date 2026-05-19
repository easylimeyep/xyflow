## 1. UI Component Extraction

- [x] 1.1 Create a controlled dumb array input popover component in `packages/ui/src/components/array-input-popover.tsx`.
- [x] 1.2 Move the current array popover visual structure and class styling into the UI component using existing `packages/ui` conventions.
- [x] 1.3 Ensure the UI component accepts plain string array values, open state, accessible labels, placeholder text, preview limit, and callbacks without importing workflow types.

## 2. Evaluator Integration

- [x] 2.1 Replace the inline evaluator `ArrayOperandPopover` UI with a workflow-aware adapter that imports the new UI component.
- [x] 2.2 Keep `open`, draft values, normalization, equality checks, commit-on-close, and `WorkflowTypedValue` creation inside `packages/flow`.
- [x] 2.3 Remove array-popover-only primitive imports and obsolete `evaluatorNodeStyles` slots from the evaluator node.

## 3. Verification

- [x] 3.1 Add focused UI package tests for preview chips, overflow badge, placeholder display, row editing, add, delete, and callback behavior.
- [x] 3.2 Update evaluator tests only where necessary and preserve coverage for draft-not-committed-before-close and commit-on-close behavior.
- [x] 3.3 Run the relevant unit tests and typecheck for affected packages.
