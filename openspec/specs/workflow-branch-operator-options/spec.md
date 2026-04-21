# workflow-branch-operator-options Specification

## Purpose
Define the configurable operator contract for the branch boolean block, including default fallback behavior and UI handling for unavailable stored operator ids.

## Requirements
### Requirement: Branch boolean block accepts structured operator definitions
The branch boolean block SHALL resolve its operator catalog from structured operator definitions where each operator includes a stable `id`, a display `value`, and a `requiresTarget` flag.

#### Scenario: Structured operator definitions drive select options
- **WHEN** the branch boolean block renders with an active operator catalog
- **THEN** each operator select option MUST use the operator `id` as its stored value
- **AND** the select label shown to the user MUST come from the operator `value`

### Requirement: Branch boolean block preserves current defaults when no overrides are supplied
If no custom branch operator catalog is provided, the branch boolean block SHALL use the current built-in operator set and current default operator selection.

#### Scenario: Default catalog is used without runtime overrides
- **WHEN** the editor mounts without a custom branch operator catalog
- **THEN** a newly added branch condition MUST default to the current built-in equality operator
- **AND** operators that currently require a target input MUST continue showing that target input

### Requirement: Branch boolean block derives target input behavior from operator metadata
The branch boolean block MUST determine whether to render the target-value input from the active operator definition instead of from a hardcoded operator-name list.

#### Scenario: Binary operator shows target input
- **WHEN** the selected operator definition has `requiresTarget` set to `true`
- **THEN** the branch boolean block MUST render the target-value input for that condition

#### Scenario: Unary operator hides target input
- **WHEN** the selected operator definition has `requiresTarget` set to `false`
- **THEN** the branch boolean block MUST hide the target-value input for that condition

### Requirement: Branch boolean block remains editable when stored operators are unavailable
If an existing branch condition contains an operator id that is not present in the active operator catalog, the branch boolean block SHALL preserve that value in the UI until the user explicitly replaces it.

#### Scenario: Missing operator id does not break the select
- **WHEN** a branch condition contains an operator id that is absent from the active operator catalog
- **THEN** the branch boolean block MUST keep the current operator value selectable in the UI
- **AND** the user MUST be able to replace it with one of the active operator definitions
