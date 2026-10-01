# extensible-node-registry Specification

## Purpose
Let a consuming product add its own node kinds — and optionally their renderers — to the workflow
editor without forking the package, while the built-in vocabulary stays the default.

## Requirements

### Requirement: Consumers register node kinds into the live vocabulary
The package SHALL expose a registration function that adds `NodeDefinition` values to the vocabulary
resolved by the palette, the node factory, config normalization, graph rules and the canvas. A
registered kind MUST behave as a built-in kind does.

#### Scenario: A registered kind joins the vocabulary
- **WHEN** a consumer registers a definition for a kind the package does not ship
- **THEN** that kind MUST appear in the registered kinds, resolve through the definition lookup, and
  render in the palette

#### Scenario: Registration order places consumer kinds after the built-ins
- **WHEN** a consumer registers new kinds
- **THEN** the vocabulary MUST list the built-in kinds first, in their existing order, followed by
  the newly registered ones

#### Scenario: Re-registering a kind replaces it
- **WHEN** the same kind is registered a second time
- **THEN** the vocabulary MUST contain exactly one definition for that kind, and it MUST be the one
  registered last

#### Scenario: Reset returns to the built-in vocabulary
- **WHEN** the registry is reset
- **THEN** the vocabulary MUST equal the built-in definitions and consumer kinds MUST no longer
  resolve

### Requirement: A node kind is validated at runtime, not by a closed type
`NodeKind` SHALL be `string`, and kind validity SHALL be answered against the live registry. Types
that describe only the shipped kinds MUST use the separate built-in union.

#### Scenario: Kind check follows registration
- **WHEN** a kind is registered and later reset away
- **THEN** the kind check MUST report it valid while registered and invalid afterwards

### Requirement: An unregistered kind degrades instead of crashing
A graph may carry a kind that is not registered. Resolution of connection rules, output paths and
expression keys for such a kind MUST return empty results, and layout MUST fall back to a single
default output handle, so the canvas still renders the node.

#### Scenario: Rules for an unregistered kind are empty
- **WHEN** connection rules or output paths are requested for an unregistered kind
- **THEN** the result MUST be an empty list and no error MUST be thrown

#### Scenario: A config update against an unregistered kind fails as an error result
- **WHEN** a node config update targets a node whose kind is not registered
- **THEN** the command MUST return an invalid-kind error result rather than throwing

### Requirement: A renderer is optional per kind
The package SHALL let a consumer register a bespoke renderer for a kind, and MUST render a kind
without one through the generic renderer driven by the definition's declared fields.

#### Scenario: A kind without a registered view renders generically
- **WHEN** a kind is registered with no accompanying view
- **THEN** the canvas MUST render it with the default node renderer built from its fields

#### Scenario: A registered view takes precedence
- **WHEN** a consumer registers a view for a kind
- **THEN** the canvas MUST render that kind with the registered component

### Requirement: Views mounted before registration reflect later registrations
Components that read the vocabulary SHALL subscribe to it, so an editor mounted before a consumer
registers its kinds MUST re-render with the new vocabulary rather than showing a stale palette or
falling back to an unknown-node renderer.

#### Scenario: Palette updates after a late registration
- **WHEN** kinds are registered after the palette has mounted
- **THEN** the palette MUST show the newly registered kinds without a remount
