## ADDED Requirements

### Requirement: Workflow editor supports measured initial auto-layout option

The `WorkflowEditor` public API SHALL expose an optional `autoLayoutOnInit` prop that allows consumers to request one-time measured initial auto-layout for the mounted editor instance.

#### Scenario: Consumer enables measured initial auto-layout

- **WHEN** a consumer renders `WorkflowEditor` with `autoLayoutOnInit="after-measure"`
- **THEN** the editor SHALL initialize from the provided `initialGraph`
- **AND** the editor SHALL run the measured initial auto-layout flow for that mounted editor instance.

#### Scenario: Consumer omits measured initial auto-layout

- **WHEN** a consumer renders `WorkflowEditor` without `autoLayoutOnInit`
- **THEN** the editor SHALL preserve the current initialization behavior
- **AND** no measured initial auto-layout bootstrap run SHALL be started.

#### Scenario: Custom composition preserves measured initial auto-layout

- **WHEN** a consumer renders `WorkflowEditor` with `autoLayoutOnInit="after-measure"` and custom children
- **THEN** descendant public editor parts SHALL use the same mounted store instance
- **AND** the measured initial auto-layout flow SHALL still apply to the mounted canvas when it becomes measurable.
