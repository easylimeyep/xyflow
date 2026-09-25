## MODIFIED Requirements

### Requirement: Evaluator branch quick-add reflects stored branch edges

The evaluator node UI SHALL show or hide branch quick-add affordances according to the branch handles stored on outgoing edges and to whether the evaluator kind fans its branches out to several targets. A single-target evaluator hides a branch's quick-add once that branch is connected; a multi-target evaluator keeps it.

#### Scenario: Connected true branch hides true quick-add

- **WHEN** a single-target evaluator node has an outgoing edge with `sourceHandle` equal to `evaluator-true`
- **THEN** the true branch quick-add affordance MUST NOT be shown

#### Scenario: Unconnected false branch shows false quick-add

- **WHEN** an evaluator node has no outgoing edge with `sourceHandle` equal to `evaluator-false`
- **THEN** the false branch quick-add affordance MUST be shown

#### Scenario: Connected multi-target branch keeps its quick-add

- **WHEN** a multi-target evaluator node, such as the built-in JSON Evaluator, has an outgoing edge on a branch handle
- **THEN** that branch's quick-add affordance MUST still be shown

#### Scenario: Quick-add from a connected multi-target branch adds another target

- **WHEN** quick-add is started from a connected branch of a multi-target evaluator and a node kind is chosen
- **THEN** the new node MUST be connected on that same branch handle
- **AND** the branch's existing connections MUST be kept
- **AND** no outgoing-connection error MUST be reported

#### Scenario: Quick-add from a connected single-target branch is refused

- **WHEN** quick-add is started from a connected branch of a single-target evaluator
- **THEN** no quick-add MUST become pending
- **AND** the branch MUST keep exactly one outgoing connection
