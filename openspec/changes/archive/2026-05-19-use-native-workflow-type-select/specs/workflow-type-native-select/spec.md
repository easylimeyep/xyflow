## ADDED Requirements

### Requirement: Workflow type controls use compact native selects

Workflow type controls SHALL use native select interaction while preserving the compact icon-sized presentation used by workflow nodes. The control SHALL expose `value` and `array` options as native select options and SHALL show a decorative icon for the currently selected type when collapsed.

#### Scenario: Collapsed control shows selected type icon

- **WHEN** a workflow type control renders with value `value`
- **THEN** the collapsed control MUST show the value type icon
- **WHEN** a workflow type control renders with value `array`
- **THEN** the collapsed control MUST show the array type icon

#### Scenario: Native select exposes text options

- **WHEN** a workflow type control renders with allowed types `value` and `array`
- **THEN** the underlying native select MUST offer options labeled `value` and `array`

#### Scenario: Native select emits selected workflow type

- **WHEN** the user selects `array` from the workflow type native select
- **THEN** the control MUST emit the workflow type value `array`
- **WHEN** the user selects `value` from the workflow type native select
- **THEN** the control MUST emit the workflow type value `value`

#### Scenario: Allowed types restrict options

- **WHEN** a workflow type control renders with allowed types containing only `value`
- **THEN** the underlying native select MUST offer `value`
- **AND** the underlying native select MUST NOT offer `array`
