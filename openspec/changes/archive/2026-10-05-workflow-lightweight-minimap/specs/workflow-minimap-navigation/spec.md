# Spec Delta

## ADDED Requirements

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
