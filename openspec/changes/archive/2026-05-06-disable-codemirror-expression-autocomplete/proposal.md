## Why

Expression fields currently expose two variable suggestion surfaces: the custom variable picker that opens for the `{{}}` placeholder flow, and CodeMirror's built-in autocomplete tooltip that can open while a user edits an already typed expression token such as `{{ email }}`.

The CodeMirror tooltip is confusing in this UI. It duplicates the custom picker, appears during ordinary text correction, and can be clipped by the expression input wrapper because the editor container intentionally uses `overflow-hidden` for the single-border rounded control. Users may only see a partial floating layer behind the input and cannot tell what it is for.

The expression editor should keep one clear variable-selection path: the custom picker. Plain expression editing should not trigger a second CodeMirror completion popup.

## What Changes

- Disable CodeMirror's built-in autocomplete tooltip in the reusable expression editor.
- Preserve the custom variable picker that opens from the `{{}}` placeholder flow and inserts variables in wrapped `{{ variable }}` format.
- Keep template highlighting, validation, blur commit, Enter commit, live change reporting, and external value sync unchanged.
- Keep pure completion helper exports available for non-rendering tests or future consumers, unless implementation proves they are now unused and can be removed in a separate cleanup.
- Verify expression fields no longer render `.cm-tooltip` autocomplete UI while editing normal tokens such as `email`.

## Capabilities

### Modified Capabilities

- `reusable-expression-editor-package`: Expression editor authoring uses the custom variable picker as the only visible variable suggestion surface; CodeMirror's implicit autocomplete tooltip does not appear during normal typing.

## Impact

- Affected code is expected in `packages/expression-editor/src/components/expression-editor/expression-editor.tsx`, where CodeMirror extensions are configured.
- Affected tests are expected in `packages/expression-editor/src/components/expression-editor/expression-editor.integration.test.tsx` and possibly autocomplete/helper tests if imports change.
- No persisted workflow data, expression parsing, validation rules, variable collection, or store behavior should change.
- Visual behavior improves by removing the clipped internal tooltip rather than trying to portal or restyle it.
