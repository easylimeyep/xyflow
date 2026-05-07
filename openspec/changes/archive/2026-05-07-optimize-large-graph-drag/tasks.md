# Tasks

- [x] 1. Stabilize keyword token inputs
  - [x] 1.1 Make `asStringArray` return the original array when every entry is already a string.
  - [x] 1.2 Refactor `KeywordExpressionListInput` to remove the `useEffect` that mirrors `rows` into `draftRows`.
  - [x] 1.3 Render keyword rows from committed values plus local live overrides.
  - [x] 1.4 Invalidate or ignore local live overrides when the committed token signature changes.
  - [x] 1.5 Preserve token add, remove, validation, variable autocomplete, and disabled-interactivity behavior.

- [x] 2. Optimize position-only drag updates
  - [x] 2.1 Identify position-only `NodeChange` batches in the store update path.
  - [x] 2.2 Skip expression dependency/cache patch work for position-only updates.
  - [x] 2.3 Preserve drag-origin history behavior so drag still commits as one undoable history step at drag end.
  - [x] 2.4 Confirm structural node/edge/config changes still rebuild expression deps/cache when needed.

- [x] 3. Add regression coverage
  - [x] 3.1 Add unit coverage for reference-stable `asStringArray` behavior.
  - [x] 3.2 Add component coverage proving repeated keyword rerenders with unchanged committed token content do not create a sync loop.
  - [x] 3.3 Add component coverage for live invalid token validation without persisting invalid whitespace values.
  - [x] 3.4 Add store coverage showing position-only drag updates keep expression structural version and catalog references stable.
  - [x] 3.5 Update representative graph performance coverage for sustained drag updates.

- [x] 4. Verify large graph interaction
  - [x] 4.1 Run focused flow and expression-editor tests.
  - [x] 4.2 Run typecheck/lint for affected packages.
  - [x] 4.3 Inspect `with large elk graph` in the browser and drag nodes for several seconds without update-depth errors.
  - [x] 4.4 Confirm drag feels smoother and no keyword token behavior regressed.
