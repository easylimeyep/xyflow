## ADDED Requirements

### Requirement: Apps can render the default workflow tour with rc-tour
Consuming applications SHALL be able to adapt `WORKFLOW_EDITOR_TOUR` to `@rc-component/tour` steps while resolving workflow editor anchors lazily from `WorkflowEditor` `anchorRefs`.

#### Scenario: Example starts an rc-tour walkthrough
- **WHEN** a user opens the workflow tour example in `apps/web` and starts the tour
- **THEN** the app displays an `@rc-component/tour` walkthrough using steps derived from `WORKFLOW_EDITOR_TOUR`

#### Scenario: Tour targets resolve through anchor refs
- **WHEN** rc-tour evaluates a step target
- **THEN** the target is resolved through the workflow tour helper against `anchorRefs.current` rather than through hard-coded DOM selectors

#### Scenario: Missing target does not break the example
- **WHEN** a workflow tour step target is not currently mounted
- **THEN** the step target resolver returns `null` without causing `WorkflowEditor` or the example page to throw

#### Scenario: Flow package remains renderer agnostic
- **WHEN** the rc-tour example is implemented
- **THEN** `@workspace/flow` does not import, instantiate, or depend on `@rc-component/tour`
