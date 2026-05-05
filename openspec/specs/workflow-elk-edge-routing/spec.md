# workflow-elk-edge-routing Specification

## Purpose
TBD - created by archiving change add-elk-edge-routing. Update Purpose after archive.
## Requirements
### Requirement: ELK auto-layout preserves routed edge paths
The workflow ELK auto-layout pipeline SHALL preserve usable ELK edge route sections as workflow edge presentation data.

#### Scenario: ELK returns routed sections
- **WHEN** ELK auto-layout returns an edge section with a start point, zero or more bend points, and an end point for a workflow edge
- **THEN** the resulting workflow graph SHALL store a routed path for that edge
- **AND** the routed path SHALL use absolute React Flow canvas coordinates
- **AND** the routed path SHALL preserve the edge id, source, target, source handle, and target handle.

#### Scenario: ELK omits a routed section
- **WHEN** ELK auto-layout returns no usable route section for a workflow edge
- **THEN** the resulting workflow graph SHALL keep the edge valid
- **AND** the edge SHALL NOT require routed path data to render.

### Requirement: Workflow edges render ELK routes when available
The workflow edge renderer SHALL draw routed edge paths from stored route points when valid routed path data is present.

#### Scenario: Edge has a valid routed path
- **WHEN** a workflow edge includes valid routed path data
- **THEN** the edge renderer SHALL draw the visible edge along the routed path points
- **AND** the edge interaction hit area SHALL follow the same routed path
- **AND** the edge toolbar SHALL be positioned at the visual midpoint of the routed path.

#### Scenario: Edge has no routed path
- **WHEN** a workflow edge does not include routed path data
- **THEN** the edge renderer SHALL render the edge with the existing Bezier fallback behavior
- **AND** existing edge selection, insertion, deletion, and hover affordances SHALL remain available.

#### Scenario: Edge has malformed routed path data
- **WHEN** a workflow edge includes routed path data that cannot form a valid path
- **THEN** the edge renderer SHALL ignore that routed path data
- **AND** the edge renderer SHALL render the edge with the existing Bezier fallback behavior.

### Requirement: ELK routing avoids node-obscuring shortcut edges
The workflow ELK layout configuration SHALL prefer routed paths that keep long shortcut edges visually separated from intermediate nodes.

#### Scenario: Branch shortcut skips intermediate true-path nodes
- **WHEN** an ELK-backed workflow contains a branch edge that connects directly to a downstream result while a sibling branch path passes through intermediate nodes
- **THEN** auto-layout SHALL provide a routed path for the shortcut edge when ELK returns a usable route
- **AND** the rendered shortcut edge SHALL use that route instead of a direct Bezier curve through the sibling path's node area.

#### Scenario: Dense graph uses orthogonal workflow routing
- **WHEN** the workflow ELK adapter builds a layout request
- **THEN** the request SHALL configure ELK to use rightward layered layout with fixed output port ordering
- **AND** the request SHALL configure routing and spacing options suitable for readable workflow edge routes.

### Requirement: Routed edge data remains compatible with graph editing
Routed edge data SHALL be optional presentation data and SHALL NOT be required for graph validation, connection validation, or edge creation.

#### Scenario: User creates an edge after layout
- **WHEN** a user creates a new workflow edge after an ELK layout pass
- **THEN** the new edge SHALL be valid without routed path data
- **AND** the new edge SHALL render with the fallback edge path until a layout pass provides route data.

#### Scenario: Auto-layout refreshes existing routes
- **WHEN** a user runs ELK auto-layout on a graph that already contains routed edge data
- **THEN** the layout result SHALL replace stale routed path data with route data from the latest ELK result
- **AND** edges without usable latest route data SHALL remain renderable through fallback behavior.

