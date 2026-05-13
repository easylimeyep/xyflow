## ADDED Requirements

### Requirement: Full e2e command
The workspace SHALL provide a full Playwright e2e command for the web app that runs all Playwright specs for `apps/web`.

#### Scenario: Run full e2e suite
- **WHEN** a developer or agent runs the full e2e command from the workspace
- **THEN** Playwright runs every web e2e spec file, including smoke specs

#### Scenario: Verify integrated web app
- **WHEN** the full e2e command runs
- **THEN** it starts or reuses the `apps/web` Next.js app and tests the real browser-rendered workflow examples

### Requirement: Smoke e2e command
The workspace SHALL provide a smoke Playwright command that runs only spec files ending with `.smoke.spec.ts`.

#### Scenario: Run smoke e2e subset
- **WHEN** a developer or agent runs the smoke e2e command
- **THEN** Playwright runs only files matching `**/*.smoke.spec.ts`

#### Scenario: Keep smoke browser scope fast
- **WHEN** the smoke e2e command runs
- **THEN** it uses Chromium as the initial browser target

### Requirement: Playwright UI command
The web app SHALL provide a Playwright UI/debug command for authoring and diagnosing e2e tests.

#### Scenario: Open interactive test runner
- **WHEN** a developer runs the Playwright UI command
- **THEN** Playwright opens its interactive UI runner for the web e2e suite

### Requirement: Initial smoke coverage
The smoke e2e suite SHALL include critical workflow editor browser checks that prove the integrated editor is usable after UI or workflow changes.

#### Scenario: Editor smoke test mounts workflow surface
- **WHEN** the smoke suite opens the web app examples page
- **THEN** it verifies that the workflow editor surface, node palette, canvas, and config panel are present

#### Scenario: Editor smoke test performs a real action
- **WHEN** the smoke suite interacts with the workflow editor
- **THEN** it performs at least one real editor action such as adding a node, opening the fullscreen workflow modal, or toggling the node palette

### Requirement: AI-agent verification guidance
The project SHALL document when AI agents should run smoke e2e versus the full e2e suite.

#### Scenario: Verify UI or workflow editor change
- **WHEN** an AI agent changes workflow editor UI, browser interaction behavior, examples, or Playwright-covered code
- **THEN** the agent is expected to run the smoke e2e command in addition to relevant unit, typecheck, or lint commands

#### Scenario: Verify final implementation
- **WHEN** a change is ready for PR, merge, or OpenSpec archive
- **THEN** the full e2e command is expected to run as part of the final verification set
