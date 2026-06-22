## MODIFIED Requirements

### Requirement: Evaluator preserves existing operator and case-sensitive scope

Evaluator typed operands SHALL resolve available evaluator operators from the effective left operand type. The effective left operand type SHALL be inferred from upstream variable metadata when the declared left operand type is `value` and inference is possible. Runtime consumers SHALL continue applying existing case-sensitive comparison semantics, including comparisons involving string entries inside array operands.

#### Scenario: Operator list follows declared array left operand type

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `array`
- **THEN** the operator select MUST expose the configured array evaluator operators

#### Scenario: Operator list follows inferred upstream array variable type

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `value`
- **AND** the left expression resolves to a single reachable upstream variable with type `array`
- **THEN** the operator select MUST expose the configured array evaluator operators

#### Scenario: Unresolved variable falls back to value operators

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `value`
- **AND** the left expression cannot be resolved to a known reachable upstream variable type
- **THEN** the operator select MUST expose the configured value evaluator operators

#### Scenario: Unresolved variable shows warning chip with tooltip

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `value`
- **AND** the left expression contains an unresolved variable reference
- **THEN** the left expression input MUST render a warning chip in the top-right corner
- **AND** the chip MUST use warning styling (yellow)
- **AND** hovering the chip MUST show a tooltip explaining the variable could not be resolved

#### Scenario: Variable rename or delete reverts to value operators when unresolved

- **WHEN** a previously resolved left expression variable becomes unresolved after upstream rename or deletion
- **THEN** the operator select MUST switch to the configured value evaluator operators
- **AND** unresolved warning chip behavior MUST be applied

#### Scenario: Invalid operator after effective type flip auto-reconciles

- **WHEN** the effective left operand type changes and current operator is not present in the target operator catalog
- **THEN** the condition operator MUST be replaced with the first operator from that target catalog
- **AND** right operand reconciliation MUST follow the selected operator `allowTypes` contract

#### Scenario: Case-sensitive flag remains available

- **WHEN** an evaluator node editor is rendered after effective type inference is introduced
- **THEN** the Case sensitive control MUST remain available
- **AND** effective type inference and operator reconciliation MUST NOT change `config.caseSensitive`
