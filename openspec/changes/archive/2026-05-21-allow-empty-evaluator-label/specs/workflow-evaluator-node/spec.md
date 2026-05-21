## MODIFIED Requirements

### Requirement: Evaluator exposes a persisted result label

Evaluator nodes SHALL include a config-level result label that identifies the evaluator result for downstream expressions. Missing evaluator label config SHALL normalize to an empty string. The Evaluator Label input SHALL use placeholder text for guidance rather than storing a default result label. The Evaluator Label input SHALL allow users to clear the label and commit an empty string.

#### Scenario: Evaluator defaults result label to empty

- **WHEN** an evaluator node is created or imported without `config.label`
- **THEN** the normalized evaluator config MUST include `label` equal to an empty string
- **AND** the normalized config MUST NOT synthesize `conditionMatched` as a stored label

#### Scenario: Evaluator accepts valid result label config

- **WHEN** a config update provides evaluator `label` with a valid JavaScript identifier
- **THEN** the evaluator config schema MUST accept the value

#### Scenario: Evaluator accepts empty result label config

- **WHEN** a config update provides evaluator `label` equal to an empty string
- **THEN** the evaluator config schema MUST accept the value

#### Scenario: Evaluator Label input commits empty result label

- **WHEN** a user clears the Evaluator Label input and commits the field
- **THEN** the evaluator node config MUST be updated with `key: "label"` and `value: ""`
- **AND** the editor MUST NOT show a required-field validation error for the empty label
- **AND** the input placeholder MAY continue to show guidance without storing that placeholder text

#### Scenario: Evaluator rejects invalid non-empty result label from the node UI

- **WHEN** a user enters a non-empty evaluator Label that is not a valid JavaScript identifier and commits the field
- **THEN** the evaluator node config MUST NOT be updated with that invalid label
- **AND** the editor MUST show an invalid-identifier validation error

#### Scenario: Evaluator rejects non-string result label config

- **WHEN** a config update or import payload provides an evaluator `label` value that is not a string
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: Evaluator result label is available to downstream expressions

Evaluator nodes SHALL be treated as variable-producing nodes for downstream expression variable discovery only when their result label is a valid non-empty JavaScript identifier. Clearing an evaluator result label SHALL remove the evaluator result from future variable discovery without rewriting existing downstream expression references to an empty name.

#### Scenario: Empty evaluator label is excluded from downstream variables

- **WHEN** an evaluator node with `config.label` equal to an empty string is upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST NOT include an empty variable entry
- **AND** the selected node's expression variable catalog MUST NOT include `conditionMatched` unless that value is explicitly stored in config

#### Scenario: Downstream node can reference explicit upstream evaluator label

- **WHEN** an evaluator node with `config.label` equal to `conditionMatched` is upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST include `conditionMatched`

#### Scenario: Evaluator label rename refactors downstream references

- **WHEN** evaluator `config.label` changes from `conditionMatched` to `isQualified`
- **THEN** downstream plain expression references to `conditionMatched` MUST be refactored to `isQualified`

#### Scenario: Evaluator label clear does not blank downstream references

- **WHEN** evaluator `config.label` changes from `conditionMatched` to an empty string
- **THEN** downstream plain expression references to `conditionMatched` MUST remain unchanged
- **AND** the selected node's expression variable catalog MUST NOT include `conditionMatched` for that evaluator unless that value is explicitly restored in config

#### Scenario: Non-upstream evaluator label is excluded

- **WHEN** an evaluator node is not reachable upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST NOT include that evaluator label

## ADDED Requirements

### Requirement: Evaluator result label storage remains distinct from variable type metadata

Evaluator result label storage SHALL remain `config.label`. Evaluator nodes MUST NOT persist `config.labelType` or `config.variableType` for result label behavior. Setter and Extractor producer metadata storage MUST remain unchanged by evaluator result label editing.

#### Scenario: Evaluator label updates preserve evaluator config shape

- **WHEN** an evaluator label update is committed
- **THEN** the evaluator node config MUST store the result label at `config.label`
- **AND** the evaluator node config MUST NOT add `labelType` or `variableType`

#### Scenario: Setter and Extractor metadata storage remains unchanged

- **WHEN** evaluator label behavior is changed
- **THEN** Setter producer labels MUST continue to use `config.variableName`
- **AND** Extractor producer labels MUST continue to use `config.extractExpression`
- **AND** Setter and Extractor type metadata MUST continue to use `config.variableType`
