## Why

Workflow editor behavior depends on browser-only interactions such as real pointer events, layout measurement, React Flow viewport behavior, CodeMirror editing, dialogs, and clipboard APIs. The current Vitest/jsdom coverage is strong for units and component integrations, but it cannot reliably catch regressions in those real browser workflows, especially after AI-assisted edits.

## What Changes

- Add a Playwright end-to-end test layer for `apps/web`, using the existing workflow examples as the browser test surface.
- Add a fast smoke subset identified by the `*.smoke.spec.ts` filename suffix.
- Add package scripts for full e2e, smoke e2e, and Playwright UI/debug mode.
- Integrate the e2e commands into the monorepo scripts and Turbo task graph.
- Document when AI agents should run smoke e2e versus the full e2e suite.

## Capabilities

### New Capabilities
- `playwright-e2e-workflow`: Browser end-to-end testing workflow for the web app, including smoke-file separation and AI-agent verification expectations.

### Modified Capabilities

## Impact

- Affects `apps/web` test tooling, package scripts, and e2e test files.
- Adds Playwright as a web app development dependency.
- Adds root/Turbo scripts so the e2e suite can be run from the workspace.
- Uses the existing Next.js examples page as the initial browser test target.
