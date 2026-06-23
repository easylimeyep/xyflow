## 1. Extractor Default Value Behavior

- [x] 1.1 Locate the `extractor` node field definition and remove persisted default `value` initialization.
- [x] 1.2 Add/update placeholder text for the extractor field so guidance is visible without storing initial content.
- [x] 1.3 Verify node creation path keeps extractor field empty until explicit user input.

## 2. Validation and Export Consistency

- [x] 2.1 Confirm validation treats placeholder as UI-only text and does not interpret it as field value.
- [x] 2.2 Update mapper/export handling if needed to ensure empty extractor values are serialized as empty/omitted per existing conventions.

## 3. Regression Coverage

- [x] 3.1 Update unit tests that currently assert default extractor `value` content.
- [x] 3.2 Add/adjust tests that assert placeholder presence and empty initial persisted data.
- [x] 3.3 Run targeted workflow test files covering node defaults, validation, and backend export behavior.
