## 1. Keyword Interactivity Gate

- [x] 1.1 Identify which React Flow node prop changes when "Toggle interactivity" is disabled for workflow nodes.
- [x] 1.2 Pass the effective interactivity state from `InlineExpressionNode` into `KeywordExpressionListInput`.
- [x] 1.3 Render the token-row delete button only when the row can be deleted and node interactivity is enabled.
- [x] 1.4 Ensure the remove handler cannot be reached from the hidden hover affordance in disabled-interactivity mode.

## 2. Tests

- [x] 2.1 Add or update Keyword node tests proving delete buttons render when interactivity is enabled.
- [x] 2.2 Add or update Keyword node tests proving delete buttons do not render when interactivity is disabled.
- [x] 2.3 Add or update tests proving disabled interactivity does not call `updateNodeConfig` through token deletion.
- [x] 2.4 Preserve coverage for removing middle rows and collapsing the final stored token row in enabled mode.

## 3. Verification

- [x] 3.1 Run the affected flow package tests.
- [x] 3.2 Run typecheck for affected packages.
- [x] 3.3 Visually verify in the workflow canvas that toggling interactivity off prevents the Keyword token delete hover affordance from appearing.
