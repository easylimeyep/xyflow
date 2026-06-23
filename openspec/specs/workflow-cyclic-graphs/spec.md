# workflow-cyclic-graphs Specification

## Purpose
Define workflow topology behavior for cyclic graph support across editor validation and serialization boundaries.

## Requirements
### Requirement: Workflow editor accepts cyclic graph connections
The workflow editor SHALL allow users to create and persist connections that introduce cycles in the workflow graph when all non-topology validation rules are satisfied.

#### Scenario: User creates a back-edge connection
- **WHEN** a user connects a source node to a target node and that connection closes a cycle
- **THEN** the editor MUST accept and persist the connection if node kinds, handles, duplicate checks, and root-node constraints are valid

#### Scenario: Invalid non-topology connection is still rejected
- **WHEN** a user creates a cyclic connection that violates existing non-topology validation rules
- **THEN** the editor MUST reject the connection with the relevant validation error

### Requirement: Cyclic topology is preserved across workflow serialization
The workflow model SHALL preserve cyclic topology when saving and loading workflow JSON in domain DTO format.

#### Scenario: Round-trip preserves cycle edges
- **WHEN** a workflow containing a cycle is serialized and then parsed back into the editor domain model
- **THEN** all cycle-forming edges MUST be preserved with the same source, target, and handle ids
