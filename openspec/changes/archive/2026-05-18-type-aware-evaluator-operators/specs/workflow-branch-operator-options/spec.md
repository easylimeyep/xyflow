## MODIFIED Requirements

### Requirement: Evaluator boolean block accepts structured operator definitions

The evaluator boolean block SHALL resolve its operator catalog from structured operator definitions grouped by left operand type. Each operator MUST include a stable `id`, a display `value`, and `allowTypes` describing the allowed right operand types.

#### Scenario: Structured operator definitions drive select options

- **WHEN** the evaluator boolean block renders with an active operator catalog
- **THEN** each operator select option MUST use the operator `id` as its stored value
- **AND** the select label shown to the user MUST come from the operator `value`
- **AND** the select options MUST come from the operator group matching the condition left operand type

#### Scenario: Operator ids are scoped by left operand type

- **WHEN** the same operator `id` exists in both the `string` and `array` operator groups
- **THEN** the evaluator boolean block MUST resolve operator metadata from the group matching the condition left operand type

### Requirement: Evaluator boolean block preserves current defaults when no overrides are supplied

If no custom evaluator operator catalog is provided, the evaluator boolean block SHALL use the built-in typed operator catalog and current default operator selection.

#### Scenario: Default catalog is used without runtime overrides

- **WHEN** the editor mounts without a custom evaluator operator catalog
- **THEN** a newly added evaluator condition MUST default to the first built-in string operator
- **AND** string operands MUST use the built-in string operator group
- **AND** array operands MUST use the built-in array operator group

### Requirement: Evaluator boolean block derives target input behavior from operator metadata

The evaluator boolean block MUST determine whether to render the target-value input from the selected operator definition's `allowTypes` instead of from a hardcoded operator-name list or `requiresTarget` flag.

#### Scenario: Binary operator shows target input

- **WHEN** the selected operator definition has `allowTypes` containing `string` or `array`
- **THEN** the evaluator boolean block MUST render the target-value input for that condition
- **AND** the right operand type picker MUST expose only the allowed operand types from `allowTypes`

#### Scenario: Unary operator hides target input

- **WHEN** the selected operator definition has `allowTypes` equal to `["none"]`
- **THEN** the evaluator boolean block MUST hide the target-value input for that condition
- **AND** the condition config MUST omit the right operand after the user selects that operator

## REMOVED Requirements

### Requirement: Evaluator boolean block remains editable when stored operators are unavailable

**Reason**: Evaluator operator catalogs are now always supplied in the new typed format and are authoritative for the workflow being edited.

**Migration**: Existing unknown-operator fallback behavior is replaced by strict reconciliation to the first available operator in the condition's active left operand type group when an edit requires reconciliation.
