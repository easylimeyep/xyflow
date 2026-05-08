## ADDED Requirements

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
