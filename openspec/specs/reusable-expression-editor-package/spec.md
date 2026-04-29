# reusable-expression-editor-package Specification

## Purpose
Defines the reusable CodeMirror-backed expression editor package boundary, public API, and preservation requirements for workflow expression fields.

## Requirements
### Requirement: Reusable expression editor package
The system SHALL provide a workspace package that exports a reusable CodeMirror-backed expression editor without requiring consumers to import workflow graph, node, edge, React Flow, or workflow store modules.

#### Scenario: Flow imports reusable editor
- **WHEN** workflow node components need an expression field
- **THEN** they SHALL import the reusable expression editor package instead of a flow-local CodeMirror implementation

#### Scenario: Editor package has no workflow graph dependency
- **WHEN** the reusable expression editor package is built or typechecked
- **THEN** it SHALL NOT depend on workflow graph, node, edge, React Flow, or workflow store modules

### Requirement: Expression editor accepts prepared variable catalog
The reusable expression editor SHALL accept prepared variable options from its consumer and SHALL NOT compute available workflow variables from nodes or edges.

#### Scenario: Consumer passes variables
- **WHEN** a consumer renders the expression editor with a list of variable options
- **THEN** the editor SHALL use those options for autocomplete and variable insertion

#### Scenario: Workflow variable discovery remains outside editor package
- **WHEN** `@workspace/flow` determines variables available to a selected node
- **THEN** it SHALL compute that catalog in flow code and pass the result into the reusable editor

### Requirement: Expression editor exposes commit-oriented API
The reusable expression editor SHALL expose a commit-oriented callback for persisted value changes and SHALL distinguish committed changes from live typing.

#### Scenario: Consumer receives committed value
- **WHEN** the user finishes editing by blurring, pressing Enter, or selecting a variable
- **THEN** the editor SHALL notify the consumer through its commit callback with the next value

#### Scenario: Live typing is optional
- **WHEN** the user types without committing
- **THEN** the editor SHALL NOT require the consumer to update persisted state for each keystroke

### Requirement: Expression editor exports pure expression utilities
The reusable expression editor package SHALL export pure utilities for template parsing, validation, insertion building, and completion construction.

#### Scenario: Tests validate templates without rendering React
- **WHEN** a test imports template validation from the reusable expression editor package
- **THEN** it SHALL be able to validate template strings without rendering the editor component

#### Scenario: Consumers build completions without rendering editor
- **WHEN** a consumer imports completion helpers from the reusable expression editor package
- **THEN** it SHALL be able to build expression completion options from a prepared variable catalog

### Requirement: Flow migration preserves expression field behavior
Migrating workflow expression fields to the reusable package SHALL preserve the current authoring behavior for set-variable, branch, extractor, and keyword expression list fields.

#### Scenario: Existing node expression fields still edit
- **WHEN** a user edits an existing workflow expression field after the migration
- **THEN** the field SHALL support the same template validation, autocomplete, variable picker, blur commit, Enter commit, and external value sync behavior as before

#### Scenario: Keyword expression list still inserts variables first-click
- **WHEN** a user types `{{}}` in a keyword expression row and selects a variable from the picker
- **THEN** the variable SHALL be inserted on the first selection attempt
