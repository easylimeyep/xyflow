# workflow-node-palette Specification

## Purpose

Defines when the workflow editor's node palette is shown, who owns its open state, and how quick-add and edge-insert borrow it as a picker without overriding the user's choice.

## Requirements

### Requirement: Palette open state is owned by the user

The editor SHALL keep a palette open state that changes only through the palette toggle (built-in or host-provided via the layout hook) or a host-controlled `open` prop. Starting, completing, or cancelling a quick-add or edge-insert MUST NOT change this state.

#### Scenario: Quick-add does not reopen a closed palette permanently

- **WHEN** the user closes the palette with the toggle
- **AND** starts a quick-add from a node output and picks a node kind
- **THEN** the palette open state SHALL remain closed
- **AND** the palette SHALL be hidden once the new node is added

#### Scenario: Quick-add leaves an open palette open

- **WHEN** the palette is open
- **AND** the user completes or cancels a quick-add
- **THEN** the palette SHALL remain open

### Requirement: Palette is shown transiently during quick-add and edge-insert

The palette SHALL be visible whenever its open state is open OR a quick-add or edge-insert is pending. When the palette is visible only because of a pending insertion, it SHALL hide as soon as the insertion ends, whether by picking a node kind or by cancelling.

#### Scenario: Closed palette appears for a quick-add

- **WHEN** the palette is closed
- **AND** the user presses "+" on a node output
- **THEN** the palette SHALL become visible in its quick-add styling

#### Scenario: Closed palette appears for an edge-insert

- **WHEN** the palette is closed
- **AND** the user presses "+" on an edge
- **THEN** the palette SHALL become visible in its quick-add styling

#### Scenario: Cancelling hides the transient palette

- **WHEN** the palette is visible only because of a pending quick-add
- **AND** the user cancels the insertion (Escape or clicking the canvas)
- **THEN** the palette SHALL be hidden

#### Scenario: Host-closed palette still appears for quick-add

- **WHEN** a host renders the palette with `open={false}`
- **AND** a quick-add becomes pending
- **THEN** the palette SHALL be visible until the insertion ends

### Requirement: Toggle pins a transiently shown palette

While the palette is visible only because of a pending insertion, activating the palette toggle SHALL set the palette open state to open and SHALL NOT cancel the pending insertion. The toggle's label SHALL reflect the palette open state.

#### Scenario: User pins the palette mid quick-add

- **WHEN** the palette is closed and shown transiently for a pending quick-add
- **AND** the user activates the palette toggle
- **THEN** the palette open state SHALL become open
- **AND** the quick-add SHALL remain pending
- **AND** after the user picks a node kind the palette SHALL remain visible

#### Scenario: Toggle label follows the open state

- **WHEN** the palette is closed and shown transiently for a pending quick-add
- **THEN** the palette toggle SHALL offer to show the palette

### Requirement: Focus leaves a palette that hides

When the palette hides while focus is inside it, focus SHALL move to the element that had focus before the palette took it for the insertion, or to the editor root when that element is no longer in the document. Focus MUST NOT remain inside a hidden palette or fall back to the document body. When focus is outside the palette as it hides, it SHALL NOT be moved.

#### Scenario: Picking a kind returns focus

- **WHEN** the palette is closed and shown transiently for a quick-add started from a node output button
- **AND** the user picks a node kind from the palette
- **THEN** focus SHALL move to the quick-add button if it is still in the document
- **AND** otherwise to the editor root

#### Scenario: Escape returns focus

- **WHEN** the palette is closed and shown transiently for a pending insertion
- **AND** the user presses Escape while focus is inside the palette
- **THEN** focus SHALL leave the palette for the element that had it before, or the editor root

#### Scenario: Pinned palette keeps focus

- **WHEN** the palette is visible because its open state is open
- **AND** the user picks a node kind for a pending quick-add
- **THEN** the palette SHALL remain visible and focus SHALL NOT be moved by the palette

#### Scenario: Focus outside the palette is left alone

- **WHEN** the palette hides because the user activated the palette toggle
- **THEN** focus SHALL stay on the toggle

### Requirement: Palette is click-only while an insertion is pending

While a quick-add or edge-insert is pending, palette entries MUST NOT be draggable onto the canvas; choosing an entry SHALL be done by activating it.

#### Scenario: Drag is unavailable during quick-add

- **WHEN** a quick-add or edge-insert is pending
- **THEN** palette entries SHALL NOT start a drag
- **AND** activating an entry SHALL complete the pending insertion

#### Scenario: Drag is available otherwise

- **WHEN** no insertion is pending and the palette is visible
- **THEN** palette entries SHALL be draggable onto the canvas

### Requirement: Floating search clearance follows the palette open state

The floating search bar SHALL make room for the floating palette based on the palette open state, not on its transient visibility. A floating palette shown transiently SHALL render above the floating search bar.

#### Scenario: Search does not move for a transient palette

- **WHEN** the palette is closed and the floating search is in a right-side or centred position
- **AND** a quick-add makes the palette visible
- **THEN** the search bar SHALL keep its position
- **AND** the palette SHALL be rendered above the search bar

#### Scenario: Search clears a user-opened palette

- **WHEN** the user opens the palette with the toggle on a canvas wide enough to hold both
- **THEN** the floating search SHALL shift to clear the palette as before

### Requirement: Layout hook exposes palette intent and visibility

`useWorkflowLayout()` SHALL return `isPaletteOpen` (the user-owned open state), `setIsPaletteOpen`, `isPaletteVisible` (whether the palette is currently shown, including transient display), `quickAddActive`, and `mode`.

#### Scenario: Host reads transient visibility

- **WHEN** the palette is closed and a quick-add is pending
- **THEN** `useWorkflowLayout()` SHALL report `isPaletteOpen` as `false`
- **AND** SHALL report `isPaletteVisible` as `true`

#### Scenario: Host toggle stays consistent with the built-in toggle

- **WHEN** a host toggle calls `setIsPaletteOpen(!isPaletteOpen)` during a pending quick-add on a closed palette
- **THEN** the palette open state SHALL become open, matching the built-in toggle's behavior
