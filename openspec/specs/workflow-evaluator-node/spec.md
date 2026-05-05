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
