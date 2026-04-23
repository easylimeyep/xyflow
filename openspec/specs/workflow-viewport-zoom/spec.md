# workflow-viewport-zoom Specification

## Purpose
Define the workflow editor viewport zoom contract, including explicit zoom bounds for user interactions and viewport refit operations.

## Requirements
### Requirement: Workflow canvas uses explicit zoom bounds
The workflow editor SHALL define explicit viewport zoom bounds for the workflow canvas instead of relying on the default bounds from the underlying graph library.

#### Scenario: Canvas receives workflow zoom bounds
- **WHEN** the workflow canvas is rendered
- **THEN** the graph viewport MUST be configured with a minimum zoom of `0.1`
- **AND** the graph viewport MUST be configured with a maximum zoom of `4`

### Requirement: Workflow zoom remains bounded
The workflow editor SHALL keep viewport zoom bounded while allowing substantially more zoom-out and zoom-in range than the graph library defaults.

#### Scenario: User zooms out for overview
- **WHEN** a user zooms out with the workflow canvas controls or supported gestures
- **THEN** the viewport MUST allow zoom values down to `0.1`
- **AND** the viewport MUST NOT allow zoom values below `0.1`

#### Scenario: User zooms in for detail
- **WHEN** a user zooms in with the workflow canvas controls or supported gestures
- **THEN** the viewport MUST allow zoom values up to `4`
- **AND** the viewport MUST NOT allow zoom values above `4`

### Requirement: View refit honors workflow zoom bounds
Workflow operations that refit the viewport SHALL use the same workflow zoom bounds as direct user zoom interactions.

#### Scenario: Auto-layout refits within workflow bounds
- **WHEN** auto-layout completes successfully and refits the graph into view
- **THEN** the refit operation MUST use the workflow minimum zoom of `0.1`
- **AND** the refit operation MUST use the workflow maximum zoom of `4`
