# workflow-evaluator-node Specification

## Purpose

TBD - created by syncing change rename-branch-to-evaluator. Update Purpose after archive.

## Requirements

### Requirement: Evaluator node is the canonical conditional logic node

The system SHALL expose an `evaluator` workflow node kind that evaluates condition config and routes execution through named true and false outputs.

#### Scenario: Evaluator node definition is available

- **WHEN** workflow node definitions are resolved
- **THEN** the canonical conditional logic node MUST have kind `evaluator`
- **AND** its visible title MUST be `Evaluator`
- **AND** it MUST retain the existing condition config shape with `conditions` and `logicalOperator`

#### Scenario: Evaluator node exposes renamed output handles

- **WHEN** an evaluator node is rendered or used in graph edges
- **THEN** the true output handle MUST use id `evaluator-true`
- **AND** the false output handle MUST use id `evaluator-false`

### Requirement: Evaluator multi-condition editing is feature flagged

The evaluator condition editor SHALL hide multi-condition creation by default and SHALL enable it only when `enableEvaluatorMultipleConditions` is true for the mounted editor runtime.

#### Scenario: Feature flag disabled hides additional condition creation

- **WHEN** an evaluator node renders with `enableEvaluatorMultipleConditions` unset or `false`
- **THEN** the `Add Condition` button MUST NOT be rendered
- **AND** only the first stored condition MUST be rendered for editing
- **AND** additional stored conditions MUST remain preserved in node config

#### Scenario: Feature flag enabled shows multi-condition controls

- **WHEN** an evaluator node renders with `enableEvaluatorMultipleConditions` set to `true`
- **THEN** the evaluator condition editor MUST render existing multi-condition controls
- **AND** the `Add Condition` action MUST append to the existing `conditions` array without changing the config format

### Requirement: Evaluator outgoing connections use named branch handles

The workflow editor SHALL prevent evaluator nodes from creating outgoing connections that do not identify one of the evaluator branch handles.

#### Scenario: Evaluator outgoing connection without branch handle is rejected

- **WHEN** a user or graph command attempts to connect from an evaluator node with `sourceHandle` unset or `null`
- **THEN** the connection MUST be rejected
- **AND** the editor graph MUST NOT store the connection

#### Scenario: Evaluator outgoing true and false branch connections are accepted

- **WHEN** a user or graph command connects from an evaluator node with `sourceHandle` equal to `evaluator-true`
- **THEN** the connection MAY be accepted if all other graph validation rules pass
- **WHEN** a user or graph command connects from an evaluator node with `sourceHandle` equal to `evaluator-false`
- **THEN** the connection MAY be accepted if all other graph validation rules pass

### Requirement: Evaluator edge insertion preserves a valid continuation branch

When an evaluator node is inserted on an existing edge, the workflow editor SHALL split the edge into valid graph connections that remain exportable to backend execution DTOs.

#### Scenario: Inserted evaluator continues through true branch

- **WHEN** an evaluator node is inserted on an existing edge
- **THEN** the upstream split edge MUST connect the original source to the inserted evaluator
- **AND** the downstream split edge MUST connect the inserted evaluator to the original target with `sourceHandle` equal to `evaluator-true`
- **AND** the inserted evaluator MUST NOT create a downstream edge with `sourceHandle` unset or `null`

#### Scenario: Inserted evaluator false branch remains available

- **WHEN** an evaluator node is inserted on an existing edge
- **THEN** the inserted evaluator's `evaluator-false` branch MUST remain unconnected unless the user explicitly connects it
- **AND** the false branch quick-add affordance MUST remain available

### Requirement: Evaluator branch quick-add reflects stored branch edges

The evaluator node UI SHALL show or hide branch quick-add affordances according to the branch handles stored on outgoing edges.

#### Scenario: Connected true branch hides true quick-add

- **WHEN** an evaluator node has an outgoing edge with `sourceHandle` equal to `evaluator-true`
- **THEN** the true branch quick-add affordance MUST NOT be shown

#### Scenario: Unconnected false branch shows false quick-add

- **WHEN** an evaluator node has no outgoing edge with `sourceHandle` equal to `evaluator-false`
- **THEN** the false branch quick-add affordance MUST be shown

### Requirement: Evaluator exposes a persisted result label
Evaluator nodes SHALL include a config-level result label that identifies the evaluator result for downstream expressions. Missing evaluator label config SHALL normalize to `conditionMatched`.

#### Scenario: Evaluator defaults result label
- **WHEN** an evaluator node is created or imported without `config.label`
- **THEN** the normalized evaluator config MUST include `label` equal to `conditionMatched`

#### Scenario: Evaluator accepts valid result label config
- **WHEN** a config update provides evaluator `label` with a valid JavaScript identifier
- **THEN** the evaluator config schema MUST accept the value

#### Scenario: Evaluator rejects non-string result label config
- **WHEN** a config update or import payload provides an evaluator `label` value that is not a string
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: Evaluator result label is available to downstream expressions
Evaluator nodes SHALL be treated as variable-producing nodes for downstream expression variable discovery when their result label is a valid JavaScript identifier.

#### Scenario: Downstream node can reference upstream evaluator label
- **WHEN** an evaluator node with `config.label` equal to `conditionMatched` is upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST include `conditionMatched`

#### Scenario: Evaluator label rename refactors downstream references
- **WHEN** evaluator `config.label` changes from `conditionMatched` to `isQualified`
- **THEN** downstream plain expression references to `conditionMatched` MUST be refactored to `isQualified`

#### Scenario: Non-upstream evaluator label is excluded
- **WHEN** an evaluator node is not reachable upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST NOT include that evaluator label
