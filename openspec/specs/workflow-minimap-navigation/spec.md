# workflow-minimap-navigation Specification

## Purpose
Define required behavior for workflow mini map navigation, viewport visibility, and container styling.

## Requirements
### Requirement: Mini map centers the viewport on click
The workflow mini map SHALL support click navigation that centers the main workflow canvas on the clicked flow position while preserving the current zoom level.

#### Scenario: User clicks a mini map point
- **WHEN** a user clicks a point in the workflow mini map
- **THEN** the workflow canvas MUST animate to a viewport centered on that flow position
- **AND** the workflow canvas MUST keep the zoom value that was active before the click

#### Scenario: User clicks a node shown in the mini map
- **WHEN** a user clicks a node representation inside the workflow mini map
- **THEN** the workflow canvas MUST treat the interaction as navigation to that clicked point
- **AND** the workflow editor MUST NOT select the node because of the mini map click

### Requirement: Mini map supports drag panning without wheel zoom
The workflow mini map SHALL allow users to pan the workflow viewport by dragging inside the mini map while keeping wheel-based mini map zoom disabled.

#### Scenario: User drags inside the mini map
- **WHEN** a user drags inside the workflow mini map
- **THEN** the workflow viewport MUST pan according to the mini map drag interaction

#### Scenario: User scrolls over the mini map
- **WHEN** a user scrolls the wheel over the workflow mini map
- **THEN** the mini map MUST NOT zoom the workflow viewport

### Requirement: Mini map viewport bounds remain visible
The workflow mini map SHALL render the active viewport bounds with a primary-colored stroke that remains visible when the user zooms far out.

#### Scenario: Workflow is viewed at low zoom
- **WHEN** the workflow canvas is zoomed far enough out that the mini map viewport bounds would otherwise be difficult to distinguish
- **THEN** the workflow mini map MUST render the active viewport bounds with `var(--primary)`
- **AND** the viewport bounds stroke MUST be thicker than the React Flow mini map default

### Requirement: Mini map container uses rounded clipped styling
The workflow mini map SHALL use the design system medium radius on its outer container and clip overflowing content without changing mini map node shapes or position.

#### Scenario: Mini map is rendered
- **WHEN** the workflow mini map is rendered
- **THEN** the mini map outer container MUST use `radius-md`
- **AND** the mini map outer container MUST clip overflow
- **AND** the mini map MUST remain in its existing bottom-left position above the workflow controls
- **AND** mini map node shapes MUST NOT be rounded by this container styling requirement

### Requirement: Mini map cost while panning does not grow with node count
Panning or zooming the workflow canvas SHALL NOT recompute or redraw the mini map's node representation. Only the viewport bounds and the mini map's visible region SHALL update on a viewport change. The node representation SHALL update only when the nodes themselves change: they move, resize, are added or removed, or become hidden or shown.

#### Scenario: User pans a large workflow
- **WHEN** a user pans or zooms a workflow canvas with hundreds of nodes
- **THEN** the mini map node representation MUST NOT be recomputed or re-rendered for that viewport change
- **AND** the mini map viewport bounds MUST follow the new viewport

#### Scenario: A node moves
- **WHEN** a node is dragged, added, removed, or resized on the canvas
- **THEN** the mini map node representation MUST update to match the new node positions and sizes

#### Scenario: A node is hidden
- **WHEN** a node is marked hidden on the canvas
- **THEN** the mini map MUST NOT draw that node

### Requirement: Mini map is the same for every graph size
The workflow mini map SHALL render and behave identically regardless of how many nodes the workflow contains. It SHALL NOT switch implementation or appearance at any node-count threshold.

#### Scenario: Workflow grows past the large-graph threshold
- **WHEN** nodes are added to a workflow until it passes the canvas's large-graph node threshold
- **THEN** the mini map MUST keep the same appearance, navigation, and styling it had below the threshold

### Requirement: Mini map draws group frames beneath their nodes
When the workflow canvas contains group frames, the workflow mini map SHALL draw them as a separate, visually distinct layer beneath the regular nodes, so that nodes inside a group remain visible in the mini map.

#### Scenario: Workflow contains a group
- **WHEN** a workflow canvas shows a group frame that contains nodes
- **THEN** the mini map MUST draw the frame beneath those nodes
- **AND** the frame MUST be visually distinguishable from regular nodes
- **AND** the nodes inside the frame MUST remain visible in the mini map
