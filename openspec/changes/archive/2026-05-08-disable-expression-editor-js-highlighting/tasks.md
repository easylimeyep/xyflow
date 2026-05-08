## 1. Specification

- [x] 1.1 Create proposal, design, and implementation tasks for disabling broad JavaScript highlighting in expression inputs.
- [x] 1.2 Add spec coverage that literal/plain text renders without JavaScript syntax highlighting while template references keep their dedicated highlighting.

## 2. Tests

- [x] 2.1 Keep or update unit coverage for template highlight ranges around delimiters and known variable bodies.
- [x] 2.2 Add focused rendered-editor coverage that plain literal text does not receive JavaScript syntax token styling.
- [x] 2.3 Keep existing expression editor integration tests passing for commit lifecycle, validation, variable insertion, and external sync.

## 3. Implementation

- [x] 3.1 Remove the JavaScript language extension from `ExpressionEditor`'s rendered CodeMirror extension list.
- [x] 3.2 Remove the now-unused `@codemirror/lang-javascript` import if no longer needed.
- [x] 3.3 Preserve the template highlight and commit extensions in the editor extension list.

## 4. Verification

- [x] 4.1 Run focused expression editor tests.
- [x] 4.2 Run package-level typecheck or the relevant workspace validation command.
- [ ] 4.3 Manually inspect a mixed expression input in the web example if a dev server/browser check is available.
