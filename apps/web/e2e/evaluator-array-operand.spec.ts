import { expect, test } from "@playwright/test"

/** Keyword → Setter (`city`) → Evaluator whose left operand is an array. */
const WORKFLOW = {
  id: "workflow-local",
  name: "Array operand",
  version: 1,
  metadata: { source: "ui" },
  viewport: { x: 0, y: 0, zoom: 1 },
  nodes: [
    {
      id: "keyword-1",
      kind: "inlineExpression",
      position: { x: 0, y: 80 },
      label: "Keyword",
      config: {
        template: [],
        isRoot: true,
        repeatable: false,
        caseSensitive: false,
      },
    },
    {
      id: "setter-1",
      kind: "setVariable",
      position: { x: 420, y: 140 },
      label: "Setter",
      config: {
        variableName: "city",
        variableType: "value",
        valueExpression: "Moscow",
        clear: false,
      },
    },
    {
      id: "evaluator-1",
      kind: "evaluator",
      position: { x: 820, y: 140 },
      label: "Evaluator",
      config: {
        label: "",
        logicalOperator: "and",
        caseSensitive: false,
        conditions: [
          {
            id: "condition-1",
            left: { type: "array", value: ["Paris", "{{ missing }}"] },
            operator: "is equal to",
            right: { type: "array", value: ["Paris"] },
          },
        ],
      },
    },
  ],
  connections: [
    {
      id: "edge-1",
      sourceNodeId: "keyword-1",
      targetNodeId: "setter-1",
      sourceHandle: null,
      targetHandle: null,
    },
    {
      id: "edge-2",
      sourceNodeId: "setter-1",
      targetNodeId: "evaluator-1",
      sourceHandle: null,
      targetHandle: null,
    },
  ],
}

test("array operand rows take variables from the picker and commit on close", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Import JSON" }).click()
  await page
    .getByPlaceholder("Paste domain workflow JSON")
    .fill(JSON.stringify(WORKFLOW))
  await page.getByRole("button", { name: "Apply Import" }).click()
  await expect(page.getByText("Workflow imported.")).toBeVisible()
  await page.getByRole("button", { name: "Close Import" }).click()
  // The palette overlays the right side of the canvas, where the evaluator sits.
  await page.getByRole("button", { name: "Hide node palette" }).click()

  const trigger = page.getByRole("button", { name: "Edit Left array values" })
  await expect(
    trigger.getByLabel(
      'Could not resolve variable "{{ missing }}" from upstream nodes.'
    )
  ).toBeVisible()

  await trigger.click()
  await page.getByRole("button", { name: "Add value" }).click()
  const newRow = page.getByRole("group", { name: "Left array value 3" })
  await newRow.locator(".cm-content").click()
  await page.keyboard.type("{{")
  await page.getByText("city", { exact: true }).click()

  // Picking a suggestion must leave the outer popover open.
  await expect(newRow).toBeVisible()
  await expect(newRow).toContainText("{{ city }}")

  // Only the array popover remains once the picker has finished closing.
  await expect(page.getByRole("dialog")).toHaveCount(1)
  // The open popover is modal, so it is dismissed rather than toggled.
  await page.keyboard.press("Escape")
  await expect(newRow).toBeHidden()
  await expect(
    trigger.locator('[data-entry-variant="variable"]', {
      hasText: "{{ city }}",
    })
  ).toBeVisible()
})
