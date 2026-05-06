## 1. Style fix

- [x] 1.1 Remove the full border declaration from the `.cm-editor` package stylesheet.
- [x] 1.2 Keep the expression editor container as the single visible input border owner.
- [x] 1.3 Verify autocomplete tooltip and validation styling still render correctly.

## 2. Regression coverage

- [x] 2.1 Add or update a focused test that prevents the reusable editor from rendering both a wrapper border and a CodeMirror border.
- [x] 2.2 Run existing expression editor integration tests to confirm commit, validation, and variable insertion behavior is unchanged.
- [x] 2.3 Run relevant flow/node tests that cover Keyword token rows or expression inputs.

## 3. Manual verification

- [x] 3.1 Start the web example app and inspect workflow expression fields.
- [x] 3.2 Confirm Keyword `Tokens` rows show exactly one visible input border.
- [x] 3.3 Confirm non-Keyword expression fields also show one visible input border.
