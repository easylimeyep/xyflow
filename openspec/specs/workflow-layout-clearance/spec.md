# workflow-layout-clearance Specification

## Purpose
TBD - created by archiving change restore-bezier-layout-constraints. Update Purpose after archive.
## Requirements
### Requirement: Workflow connections retain curved visual style
The workflow editor SHALL render standard workflow connections with the existing curved Bezier-style visual unless a future explicit capability introduces a separate routed-edge display mode.

#### Scenario: Standard edge renders as a curved connection
- **WHEN** a workflow edge has valid source and target node handles
- **THEN** the rendered connection SHALL use the standard curved workflow edge path
- **AND** the rendered connection SHALL NOT switch to an ELK orthogonal line-segment path because route metadata is present.

#### Scenario: Route metadata does not change the default edge visual
- **WHEN** a workflow edge includes transient route metadata from a layout computation
- **THEN** the standard workflow edge renderer SHALL preserve the curved connection visual
- **AND** the edge SHALL remain connected to its React Flow source and target handle coordinates.

### Requirement: Layout clearance is handled by node placement
The workflow layout system SHALL prioritize node placement and ELK layout constraints to improve connection readability rather than relying on rendered orthogonal edge routes to avoid node bodies.

#### Scenario: Shortcut branch path receives visible clearance
- **WHEN** the large ELK workflow example is laid out
- **THEN** shortcut branch connections from a branch output directly to a result node SHALL have visible clearance from unrelated intermediate node bodies
- **AND** the layout SHALL avoid placing unrelated nodes directly under the shortcut connection path when a deterministic alternative placement is available.

#### Scenario: Layout preserves connection semantics
- **WHEN** layout clearance adjustments are applied
- **THEN** every workflow connection SHALL preserve its original source node, target node, source handle, and target handle
- **AND** no connection SHALL be modeled as connecting to another connection.

### Requirement: Connections do not visually imply edge-to-edge attachment
The workflow editor SHALL avoid rendering standard workflow connections in a way that makes independent connections appear to join each other as shared routed corridors.

#### Scenario: Independent connections remain visually distinct
- **WHEN** multiple workflow connections are rendered near each other after auto-layout
- **THEN** each connection SHALL visually originate from a node output handle and terminate at a node input handle
- **AND** the renderer SHALL NOT create shared orthogonal trunk segments that imply one connection attaches to another connection.

