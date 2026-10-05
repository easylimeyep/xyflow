# Spec Delta

## MODIFIED Requirements

### Requirement: Search opens with a scoped hotkey in edit and observe modes

The search SHALL open and focus its input when the user presses `Mod+F` (`Cmd+F` on macOS, `Ctrl+F` elsewhere) while focus is inside the workflow editor. `Mod+F` pressed outside the workflow editor SHALL keep the browser's default behavior. Pressing `Mod+F` while the search is already open SHALL focus and select the query. `Escape` in the search input SHALL close the search. Search SHALL be available in both edit and observe modes.

When `Mod+F` is pressed while the focused element inside the editor holds a usable text selection, the search query SHALL be set to the selected text before the search opens or, if it is already open, before its query is focused and selected. This SHALL apply to text inputs, text areas and content-editable fields such as expression fields. A selection is usable when it is non-empty, contains a non-whitespace character and spans a single line. The selected text SHALL be used as is, without trimming or removing expression delimiters. A selection that is not usable SHALL leave the query unchanged. A selection inside the search bar's own query input SHALL NOT change the query.

#### Scenario: Hotkey inside the editor

- **WHEN** focus is on the workflow canvas and the user presses `Mod+F`
- **THEN** the search bar SHALL open with its input focused
- **AND** the browser's own find SHALL NOT open

#### Scenario: Hotkey outside the editor

- **WHEN** focus is outside the workflow editor and the user presses `Mod+F`
- **THEN** the workflow search SHALL NOT open

#### Scenario: Escape closes search

- **WHEN** the search input is focused and the user presses `Escape`
- **THEN** the search SHALL close and all match marks SHALL be removed

#### Scenario: Available in observe mode

- **WHEN** the editor is in observe mode
- **AND** the user presses `Mod+F` inside the editor
- **THEN** the search SHALL open and navigate matches as in edit mode

#### Scenario: Selection in an expression field seeds the query

- **WHEN** the search is closed
- **AND** the user selects `price` inside an expression field and presses `Mod+F`
- **THEN** the search SHALL open with the query `price`
- **AND** the search input SHALL be focused with its query selected

#### Scenario: Selection in a text input seeds the query

- **WHEN** the search is closed
- **AND** the user selects `Calc` in a node label input and presses `Mod+F`
- **THEN** the search SHALL open with the query `Calc`

#### Scenario: Selection replaces the query of an open search

- **WHEN** the search is open with the query `rate`
- **AND** the user selects `price` inside an expression field and presses `Mod+F`
- **THEN** the query SHALL become `price`
- **AND** the search input SHALL be focused with its query selected

#### Scenario: No selection keeps the query

- **WHEN** the search is open with the query `rate`
- **AND** the caret is in an expression field with no text selected
- **AND** the user presses `Mod+F`
- **THEN** the query SHALL stay `rate`
- **AND** the search input SHALL be focused with its query selected

#### Scenario: Whitespace-only or multi-line selection is ignored

- **WHEN** the selected text is only whitespace or spans more than one line
- **AND** the user presses `Mod+F`
- **THEN** the query SHALL stay unchanged

#### Scenario: Selected text is used as is

- **WHEN** the user selects `{{ price }}` inside an expression field and presses `Mod+F`
- **THEN** the query SHALL be `{{ price }}`

#### Scenario: Selection inside the search input does not seed

- **WHEN** the search is open with the query `price total`
- **AND** the user selects `total` inside the search input and presses `Mod+F`
- **THEN** the query SHALL stay `price total`
- **AND** the whole query SHALL be selected
