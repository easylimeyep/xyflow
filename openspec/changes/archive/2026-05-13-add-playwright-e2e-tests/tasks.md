## 1. Playwright Setup

- [x] 1.1 Add Playwright test dependencies to `apps/web`.
- [x] 1.2 Add `apps/web/playwright.config.ts` with web server startup for the existing Next.js app.
- [x] 1.3 Add `apps/web/e2e/` test directory and any shared helpers needed by the first tests.
- [x] 1.4 Add `test:e2e`, `test:e2e:smoke`, and `test:e2e:ui` scripts to `apps/web/package.json`.
- [x] 1.5 Add root workspace and Turbo task entries so `pnpm test:e2e` and filtered web e2e commands work predictably.

## 2. Smoke E2E Coverage

- [x] 2.1 Add a `*.smoke.spec.ts` test that opens the examples page and verifies the workflow editor surface is mounted.
- [x] 2.2 Add a smoke assertion for node palette, canvas, and config panel availability.
- [x] 2.3 Add a smoke interaction that performs a real browser action such as toggling the palette or adding a node.
- [x] 2.4 Add a smoke test for opening and closing the fullscreen workflow modal.

## 3. Full E2E Coverage

- [x] 3.1 Add at least one non-smoke e2e spec for a deeper workflow editor behavior.
- [x] 3.2 Cover one browser-only interaction that is weakly represented in jsdom, such as drag/drop, measured layout, CodeMirror editing, or modal-contained editor behavior.
- [x] 3.3 Keep full e2e specs separate from smoke specs by using normal `*.spec.ts` filenames without the `.smoke` suffix.

## 4. Agent Verification Guidance

- [x] 4.1 Document that AI agents should run smoke e2e after workflow editor UI, browser interaction, examples, or Playwright-covered changes.
- [x] 4.2 Document that full e2e should run before PR, merge, or OpenSpec archive.
- [x] 4.3 Document the difference between `test:e2e`, `test:e2e:smoke`, and `test:e2e:ui`.

## 5. Verification

- [x] 5.1 Run the smoke e2e command and confirm only `*.smoke.spec.ts` files execute.
- [x] 5.2 Run the full e2e command and confirm all Playwright specs execute.
- [x] 5.3 Run relevant existing checks, including typecheck and unit tests for affected packages.
