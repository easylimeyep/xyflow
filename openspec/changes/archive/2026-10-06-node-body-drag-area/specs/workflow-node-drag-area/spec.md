# Spec Delta

## Purpose

Defines which parts of a workflow node on the canvas move the node when dragged and which parts belong to its interactive controls.

## ADDED Requirements

### Requirement: Node body drags the node

In edit mode, a drag that starts anywhere on a draggable workflow node SHALL move the node, unless the drag starts on an interactive control. This covers the header, field labels, helper text, the space between fields, and the node's padding. Nodes in a multi-selection SHALL move together, as they do when dragged by the header.

#### Scenario: Drag by a field label

- **WHEN** the user presses on a field label of a node, such as "Path", and drags by (dx, dy)
- **THEN** the node MUST move by (dx, dy)
- **AND** the canvas MUST NOT pan

#### Scenario: Drag by the space between fields

- **WHEN** the user presses on empty space inside a node body, between two fields, and drags
- **THEN** the node MUST move

#### Scenario: Drag another node right after selecting one

- **WHEN** one node is selected and the user presses on a field label of a different, unselected node and drags
- **THEN** the pressed node MUST move
- **AND** it MUST become the selection, as it does when dragged by its header

### Requirement: Interactive controls do not drag the node

A drag that starts on an interactive control inside a node SHALL NOT move the node and SHALL NOT pan the canvas. Interactive controls are:

- text inputs and expression editors
- select triggers and checkboxes
- buttons, including header actions
- popover triggers
- condition reorder handles

Each control SHALL keep its own pointer behavior.

#### Scenario: Select text in an input

- **WHEN** the user presses inside a text input of a node and drags across its text
- **THEN** the text MUST be selected
- **AND** the node MUST NOT move and the canvas MUST NOT pan

#### Scenario: Select text in an expression editor

- **WHEN** the user presses inside an expression editor of a node and drags
- **THEN** the editor MUST handle the gesture
- **AND** the node MUST NOT move

#### Scenario: Open a select

- **WHEN** the user clicks a select trigger inside a node, including the Result node and the JSON Evaluator match type
- **THEN** the select MUST open
- **AND** the node MUST NOT move

#### Scenario: Reorder a condition

- **WHEN** the user drags a condition by its reorder handle in an evaluator node
- **THEN** the condition MUST be reordered
- **AND** the node MUST NOT move
