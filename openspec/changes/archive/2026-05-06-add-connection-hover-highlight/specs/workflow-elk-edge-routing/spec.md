## MODIFIED Requirements

### Requirement: Workflow edges render ELK routes when available
The workflow edge renderer SHALL draw routed edge paths from stored route points when valid routed path data is present, and SHALL provide a primary-colored hover highlight for interactive workflow connections.

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

#### Scenario: User hovers a workflow connection
- **WHEN** the pointer hovers over a workflow connection's visible path or transparent interaction path
- **THEN** the visible connection stroke SHALL use `var(--primary)`
- **AND** the connection toolbar SHALL remain available.

#### Scenario: User moves from a hovered connection to its toolbar
- **WHEN** a workflow connection toolbar is visible because of edge hover
- **AND** the pointer moves from the connection path onto that toolbar
- **THEN** the visible connection stroke SHALL remain highlighted with `var(--primary)`
- **AND** the toolbar actions SHALL remain usable.
