## ADDED Requirements

### Requirement: Extractor input defaults are placeholder-only
The system SHALL initialize the `extractor` node's configurable input field without a persisted default `value`. Guidance text for first-time configuration MUST be provided via the field `placeholder` instead of pre-populating stored node data.

#### Scenario: New extractor node starts with empty stored value
- **WHEN** a user adds a new `extractor` node to the workflow
- **THEN** the node data for the configurable extractor field MUST be empty by default
- **AND** no example text MUST be persisted as the field `value`

#### Scenario: Placeholder provides guidance without changing data
- **WHEN** the extractor field is displayed before user input
- **THEN** the UI MUST show placeholder guidance text
- **AND** that placeholder text MUST NOT be treated as user-provided value during validation, mapping, or export
