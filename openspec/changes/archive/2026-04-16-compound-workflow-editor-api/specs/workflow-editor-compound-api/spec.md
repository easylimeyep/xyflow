## ADDED Requirements

### Requirement: Workflow editor root supports default and custom composition
The system SHALL expose `WorkflowEditor` as the public root component for the flow package. `WorkflowEditor` SHALL accept the existing store initialization props and SHALL mount a workflow store instance for all descendant editor parts.

#### Scenario: Consumer renders the editor without children
- **WHEN** a consumer renders `WorkflowEditor` without passing `children`
- **THEN** the editor SHALL mount successfully
- **AND** it SHALL render the default editor composition

#### Scenario: Consumer renders the editor with custom children
- **WHEN** a consumer renders `WorkflowEditor` with custom `children`
- **THEN** the editor SHALL mount the workflow store once
- **AND** it SHALL render the provided children instead of the default composition

### Requirement: Workflow editor provides reusable compound components
The system SHALL expose reusable editor parts on the `WorkflowEditor` component namespace so consumers can assemble custom editor layouts from public building blocks.

#### Scenario: Consumer uses compound editor parts
- **WHEN** a consumer renders `WorkflowEditor.Toolbar`, `WorkflowEditor.Body`, `WorkflowEditor.Palette`, `WorkflowEditor.Canvas`, and `WorkflowEditor.ConfigPanel` within `WorkflowEditor`
- **THEN** each part SHALL bind to the mounted workflow store
- **AND** the editor SHALL support a functional custom composition without requiring internal-only components

#### Scenario: Consumer omits some editor parts
- **WHEN** a consumer renders only a subset of the public compound parts within `WorkflowEditor`
- **THEN** the provided parts SHALL continue to function with the mounted workflow store
- **AND** the system SHALL treat resulting layout gaps as consumer-owned composition choices

### Requirement: Workflow editor parts are also available as named exports
The system SHALL expose the public editor parts as named exports in addition to the `WorkflowEditor` compound namespace.

#### Scenario: Consumer imports a named editor part
- **WHEN** a consumer imports a public editor part directly from the flow package
- **THEN** that part SHALL provide the same behavior as the corresponding `WorkflowEditor.*` component

### Requirement: Workflow editor exposes a curated hooks namespace
The system SHALL expose a `WorkflowEditor.use` namespace for reusable store access hooks. The namespace SHALL include `store`, `shallowStore`, `graph`, `selection`, and `actions`.

#### Scenario: Consumer reads graph state through the hooks namespace
- **WHEN** a consumer calls `WorkflowEditor.use.graph` inside a descendant of `WorkflowEditor`
- **THEN** the hook SHALL return the current workflow graph for the mounted store instance

#### Scenario: Consumer reads curated selection and actions hooks
- **WHEN** a consumer calls `WorkflowEditor.use.selection` or `WorkflowEditor.use.actions` inside a descendant of `WorkflowEditor`
- **THEN** the hook SHALL return a stable UI-facing selection or action contract derived from the mounted workflow store

### Requirement: Legacy Flow root is removed
The system SHALL remove the legacy `Flow` public component from the package entrypoint once `WorkflowEditor` is available as the root composition API.

#### Scenario: Consumer imports from the package root
- **WHEN** the package root exports are evaluated after this change
- **THEN** `WorkflowEditor` SHALL be the public root editor entrypoint
- **AND** `Flow` SHALL no longer be exported
