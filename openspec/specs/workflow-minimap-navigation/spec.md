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
