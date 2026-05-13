## Context

The monorepo already has Vitest coverage for workflow store logic, mappers, node components, editor composition, and expression-editor integrations. Those tests run in jsdom and are a good fit for fast local validation, but they cannot fully exercise the browser behavior that matters to the workflow editor: measured layout, React Flow viewport behavior, pointer interactions, drag/drop, CodeMirror input behavior, dialogs, and clipboard APIs.

The existing `apps/web` Next.js app imports the workspace packages and renders workflow editor examples on one page. That makes it the best first Playwright target because it verifies the integrated product surface rather than an isolated package fixture.

## Goals / Non-Goals

**Goals:**
- Add Playwright as the browser e2e runner for `apps/web`.
- Provide a fast smoke command that runs only files ending in `*.smoke.spec.ts`.
- Provide a full e2e command that runs all Playwright specs.
- Provide a Playwright UI/debug command for developing and diagnosing tests.
- Make the smoke command suitable for AI-agent verification after workflow/UI edits.
- Keep Vitest as the primary unit and component integration test layer.

**Non-Goals:**
- Replace existing Vitest tests.
- Add broad cross-browser coverage in the initial rollout.
- Test every workflow editor behavior through e2e immediately.
- Add CI provider configuration unless the repository already has a CI integration point.

## Decisions

### Place Playwright in `apps/web`

Playwright configuration, fixtures, and e2e specs will live under `apps/web` because the web app is the real browser integration target for `@workspace/flow`, `@workspace/store`, `@workspace/expression-editor`, and `@workspace/ui`.

Alternative considered: a root-level `e2e` package. That would be useful once multiple apps need shared browser tests, but it adds indirection before there is more than one browser target.

### Separate smoke tests by file suffix

Smoke tests will be files matching `**/*.smoke.spec.ts`. The smoke script will run that file pattern in Chromium. Full e2e will run all Playwright specs, including smoke specs.

Alternative considered: `@smoke` tags in test names. Tags are flexible, but file suffixes are easier for AI agents and reviewers to recognize without scanning test bodies.

### Start with Chromium for smoke

The smoke command will run Chromium only. This keeps the post-agent verification loop quick and avoids turning every small UI edit into a full compatibility matrix.

Alternative considered: all browser projects for smoke. That improves browser coverage but makes the command slower and less likely to be used after every relevant AI change.

### Use the existing examples page as the first test surface

Initial tests will navigate to `/`, use the workflow examples tabs, and verify real user-visible flows such as editor mount, palette/canvas availability, adding nodes, and fullscreen modal behavior.

Alternative considered: dedicated hidden test routes. Those can be added later for hard-to-reach states, but the existing examples page better matches how the editor is documented and manually exercised today.

### Prefer accessible locators, add stable test ids only where browser canvas behavior needs them

Tests will prefer roles, labels, and visible text. When React Flow canvas internals or repeated nodes make accessible locators ambiguous, implementation may add narrowly-scoped `data-testid` hooks.

Alternative considered: CSS selectors against React Flow internals. That would be brittle across library updates and class changes.

## Risks / Trade-offs

- Playwright install may require browser binaries on new machines. Mitigation: document the required install step and keep scripts standard for Playwright.
- Browser tests can become flaky around animations, layout, and drag/drop. Mitigation: keep smoke tests minimal, assert stable user-visible states, and reserve deeper interaction coverage for full e2e.
- Smoke tests may give false confidence if they grow too shallow. Mitigation: require at least one actual workflow editor action in smoke, not just page load.
- Full e2e can become slow. Mitigation: keep `test:e2e:smoke` as the agent loop and use full e2e before PR/merge/archive.
