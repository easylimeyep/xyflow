## MODIFIED Requirements

### Requirement: Evaluator exposes a persisted result label

Evaluator nodes SHALL include a config-level result label that identifies the evaluator result for downstream expressions. Missing evaluator label config SHALL normalize to an empty string. The Evaluator Label input SHALL use placeholder text for guidance rather than storing a default result label.

#### Scenario: Evaluator defaults result label to empty

- **WHEN** an evaluator node is created or imported without `config.label`
- **THEN** the normalized evaluator config MUST include `label` equal to an empty string
- **AND** the normalized config MUST NOT synthesize `conditionMatched` as a stored label

#### Scenario: Evaluator accepts valid result label config

- **WHEN** a config update provides evaluator `label` with a valid JavaScript identifier
- **THEN** the evaluator config schema MUST accept the value

#### Scenario: Evaluator rejects non-string result label config

- **WHEN** a config update or import payload provides an evaluator `label` value that is not a string
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: Evaluator result label is available to downstream expressions

Evaluator nodes SHALL be treated as variable-producing nodes for downstream expression variable discovery only when their result label is a valid non-empty JavaScript identifier.

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

#### Scenario: Non-upstream evaluator label is excluded

- **WHEN** an evaluator node is not reachable upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST NOT include that evaluator label
