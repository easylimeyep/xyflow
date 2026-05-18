## ADDED Requirements

### Requirement: Workflow editor exposes tour anchor registry
The workflow editor SHALL accept an optional `anchorRefs` prop that stores mounted public editor anchor elements in a single mutable registry object.

#### Scenario: App passes one anchor registry ref
- **WHEN** an app renders `WorkflowEditor` with `anchorRefs={anchorRefs}`
- **THEN** mounted public editor elements are registered in `anchorRefs.current`

#### Scenario: Anchor element unmounts
- **WHEN** a public editor element associated with an anchor unmounts
- **THEN** the corresponding entry is removed from `anchorRefs.current`

#### Scenario: Missing anchor registry
- **WHEN** an app renders `WorkflowEditor` without `anchorRefs`
- **THEN** the editor renders normally without requiring tour integration setup

### Requirement: Workflow editor exposes editor-level anchors
The workflow editor SHALL expose stable editor-level anchors for tourable surfaces including root, toolbar, palette, palette toggle, canvas, controls, zoom in, zoom out, fit view, auto layout, and config panel.

#### Scenario: Tour targets editor controls
- **WHEN** the workflow editor renders its default composition
- **THEN** `anchorRefs.current` contains registered elements for available editor-level anchors

#### Scenario: React Flow zoom controls are tourable
- **WHEN** the workflow canvas controls render
- **THEN** zoom in, zoom out, and fit view controls can be resolved from public workflow editor anchors without relying on `@xyflow/react` internal DOM selectors

### Requirement: Workflow editor exposes palette item anchors by node kind
The workflow editor SHALL expose palette item anchors under `paletteItems`, keyed by the existing `NodeKind` union.

#### Scenario: Palette item anchor resolves by kind
- **WHEN** the node palette renders an item for a registered node kind
- **THEN** `anchorRefs.current.paletteItems[kind]` references that palette item element

#### Scenario: New node kind is added
- **WHEN** a new node kind is added to the workflow node registry
- **THEN** its palette item anchor uses the same `paletteItems[kind]` structure without adding a new top-level anchor key

### Requirement: Flow package exports default workflow tour metadata
The flow package SHALL export `WORKFLOW_EDITOR_TOUR` as default workflow editor tour metadata that references public workflow tour anchors instead of DOM elements.

#### Scenario: App adapts default tour metadata
- **WHEN** an app imports `WORKFLOW_EDITOR_TOUR`
- **THEN** each step contains stable content and anchor metadata that can be resolved against `anchorRefs.current`

#### Scenario: Tour metadata stays renderer agnostic
- **WHEN** the flow package exports default tour metadata
- **THEN** it does not require or instantiate a tour rendering library

### Requirement: Tour anchors resolve lazily in consuming apps
The flow package SHALL support consuming apps that resolve tour anchors lazily through callbacks such as `target: () => HTMLElement | null`.

#### Scenario: Tour resolves a mounted anchor
- **WHEN** a consuming app resolves a tour step anchor against `anchorRefs.current` after the editor has mounted
- **THEN** the resolver returns the current DOM element for that anchor

#### Scenario: Tour resolves an unavailable anchor
- **WHEN** a consuming app resolves a tour step anchor whose element is not currently mounted
- **THEN** the resolver can return `null` without the workflow editor throwing an error
