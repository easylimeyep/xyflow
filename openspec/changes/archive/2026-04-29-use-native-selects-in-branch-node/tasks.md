## 1. Branch Node Selects

- [x] 1.1 Replace the branch condition operator custom select imports and JSX with `NativeSelect` and `NativeSelectOption`.
- [x] 1.2 Replace the interactive logical operator custom select with `NativeSelect` while keeping non-interactive separator badges unchanged.
- [x] 1.3 Preserve existing branch update behavior for condition operator ids, logical operator values, missing operator fallback options, and `requiresTarget` target input visibility.

## 2. Styling

- [x] 2.1 Adjust branch node select style slots so native selects keep the compact sizing currently used in condition rows and logical separators.
- [x] 2.2 Verify native select controls remain usable inside the branch node's `nodrag nopan` root and sortable condition rows.

## 3. Tests

- [x] 3.1 Update branch node tests to remove the custom select mock and exercise native select `change` events.
- [x] 3.2 Add or update assertions for runtime operator labels, unknown stored operator fallback options, target input visibility, and logical operator updates.
- [x] 3.3 Run the focused branch node test file and relevant package checks available for this workspace.
