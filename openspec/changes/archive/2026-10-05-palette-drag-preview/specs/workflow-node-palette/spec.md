# Spec Delta

## ADDED Requirements

### Requirement: Dragging an entry shows a dedicated node preview

When a palette entry starts a drag, the editor SHALL supply its own drag image: a preview of the dragged node kind showing its icon and title on an opaque, bordered surface. The drag image MUST NOT be a snapshot of the palette card, so nothing painted by the palette's surroundings (such as the list's scrollbar) can appear in it. The preview SHALL be anchored with the pointer at its top-left corner, the point where a drop on the canvas places the new node. Starting the drag SHALL NOT change the palette's visible layout.

#### Scenario: Drag uses the kind's preview

- **WHEN** no insertion is pending
- **AND** the user starts dragging the palette entry for a node kind
- **THEN** the drag image SHALL be the preview showing that kind's icon and title
- **AND** the drag SHALL carry that node kind for the canvas drop

#### Scenario: Scrollbar does not leak into the drag image

- **WHEN** the palette's entry list is scrollable
- **AND** the user drags an entry
- **THEN** the drag image SHALL show no part of the list's scrollbar or of neighbouring palette content

#### Scenario: Preview anchors at the drop point

- **WHEN** the user drags an entry and drops it on the canvas
- **THEN** the new node's top-left corner SHALL appear where the preview's top-left corner was under the pointer

#### Scenario: Preview stays out of the palette layout

- **WHEN** the palette is rendered and no drag is in progress
- **THEN** the preview SHALL NOT be visible to the user or exposed to assistive technology
- **AND** the palette entries SHALL keep their size and position
