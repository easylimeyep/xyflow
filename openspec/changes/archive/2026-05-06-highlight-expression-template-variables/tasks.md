## 1. Specification

- [x] 1.1 Create proposal, design, and implementation tasks for expression template highlighting.
- [x] 1.2 Add spec coverage for known variable accenting and unknown variable non-accenting.

## 2. Tests

- [x] 2.1 Add unit coverage for highlight range generation from template strings and variable catalogs.
- [x] 2.2 Add style coverage for delimiter/body highlight CSS classes.
- [x] 2.3 Keep existing expression editor integration tests passing.

## 3. Implementation

- [x] 3.1 Add a CodeMirror decoration extension for template expression highlighting.
- [x] 3.2 Wire the extension into `ExpressionEditor` using the current `variables` catalog.
- [x] 3.3 Add subtle CSS for muted delimiters and known variable body accents.

## 4. Verification

- [x] 4.1 Run focused expression editor tests.
- [x] 4.2 Run expression editor typecheck or package-level validation.
