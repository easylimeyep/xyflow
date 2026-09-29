import { expect, test, type Page } from "@playwright/test"

/**
 * A setter defines `price` at the top; two nodes far below and to the right
 * reference it, so reaching them has to move the viewport. "Setter" and the
 * other labels are chosen not to contain "price", keeping the count at three.
 */
const WORKFLOW = {
  id: "workflow-local",
  name: "Canvas search",
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
        variableName: "price",
        variableType: "value",
        valueExpression: "10",
        clear: false,
      },
    },
    {
      id: "inline-1",
      kind: "inlineExpression",
      position: { x: 2400, y: 1400 },
      label: "Message",
      config: {
        template: ["total {{ price }}"],
        isRoot: false,
        repeatable: false,
        caseSensitive: false,
      },
    },
    {
      id: "evaluator-1",
      kind: "evaluator",
      position: { x: 3600, y: 2600 },
      label: "Evaluator",
      config: {
        label: "",
        logicalOperator: "and",
        caseSensitive: false,
        conditions: [
          {
            id: "condition-1",
            left: { type: "value", value: "{{ price }}" },
            operator: "is equal to",
            right: { type: "value", value: "10" },
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
      targetNodeId: "inline-1",
      sourceHandle: null,
      targetHandle: null,
    },
    {
      id: "edge-3",
      sourceNodeId: "inline-1",
      targetNodeId: "evaluator-1",
      sourceHandle: null,
      targetHandle: null,
    },
  ],
}

async function importWorkflow(page: Page) {
  await page.goto("/")
  await page.getByRole("button", { name: "Import JSON" }).click()
  await page
    .getByPlaceholder("Paste domain workflow JSON")
    .fill(JSON.stringify(WORKFLOW))
  await page.getByRole("button", { name: "Apply Import" }).click()
  await expect(page.getByText("Workflow imported.")).toBeVisible()
  await page.getByRole("button", { name: "Close Import" }).click()
}

function viewportTransform(page: Page) {
  return page
    .locator(".react-flow__viewport")
    .evaluate((element) => (element as HTMLElement).style.transform)
}

test("canvas search steps through variable occurrences without selecting", async ({
  page,
}) => {
  await importWorkflow(page)

  const keyword = page.locator('.react-flow__node[data-id="keyword-1"]')
  await keyword.getByText("Keyword").first().click()
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(1)
  await expect(keyword).toHaveClass(/selected/)

  await page.keyboard.press("ControlOrMeta+f")
  const input = page.getByLabel("Search nodes and variables")
  await expect(input).toBeFocused()

  await input.fill("price")
  const counter = page.getByTestId("workflow-search-counter")
  await expect(counter).toHaveText("1 / 3")
  await expect(
    page.locator('[data-node-id="setter-1"][data-search-state="current"]')
  ).toBeVisible()
  await expect(page.locator('[data-search-state="match"]')).toHaveCount(2)

  const before = await viewportTransform(page)
  await input.press("Enter")
  await expect(counter).toHaveText("2 / 3")
  await expect(
    page.locator('[data-node-id="inline-1"][data-search-state="current"]')
  ).toHaveCount(1)
  await expect.poll(() => viewportTransform(page)).not.toBe(before)

  await input.press("Enter")
  await expect(counter).toHaveText("3 / 3")
  await input.press("Shift+Enter")
  await expect(counter).toHaveText("2 / 3")

  // Stepping never touched the selection.
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(1)
  await expect(keyword).toHaveClass(/selected/)

  await input.press("Escape")
  await expect(page.getByTestId("workflow-search")).toBeHidden()
  await expect(page.locator("[data-search-state]")).toHaveCount(0)
})

test("Mod+F outside the editor is left to the browser", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("region", { name: "Workflow canvas" })
  ).toBeVisible()

  // Dispatched on the body: outside the editor's root element.
  const prevented = await page.evaluate(() => {
    const event = new KeyboardEvent("keydown", {
      key: "f",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.body.dispatchEvent(event)
    return event.defaultPrevented
  })

  expect(prevented).toBe(false)
  await expect(page.getByTestId("workflow-search")).toHaveCount(0)
})

test("Mod+F opens search after clicking the empty canvas", async ({ page }) => {
  await importWorkflow(page)

  await page.locator(".react-flow__pane").click({ position: { x: 40, y: 40 } })
  await page.keyboard.press("ControlOrMeta+f")

  await expect(page.getByLabel("Search nodes and variables")).toBeFocused()
})

test("the strong mark moves between fields of one node", async ({ page }) => {
  const workflow = {
    ...WORKFLOW,
    nodes: WORKFLOW.nodes.map((node) =>
      node.id === "setter-1" ? { ...node, label: "Price setter" } : node
    ),
  }
  await page.goto("/")
  await page.getByRole("button", { name: "Import JSON" }).click()
  await page
    .getByPlaceholder("Paste domain workflow JSON")
    .fill(JSON.stringify(workflow))
  await page.getByRole("button", { name: "Apply Import" }).click()
  await expect(page.getByText("Workflow imported.")).toBeVisible()
  await page.getByRole("button", { name: "Close Import" }).click()

  await page.locator(".react-flow__pane").click({ position: { x: 40, y: 40 } })
  await page.keyboard.press("ControlOrMeta+f")
  const input = page.getByLabel("Search nodes and variables")
  await input.fill("price")

  const setter = page.locator('[data-node-id="setter-1"]')
  const currentField = setter.locator('[data-field-search-state="current"]')
  await expect(page.getByTestId("workflow-search-counter")).toHaveText("1 / 4")
  await expect(currentField).toHaveText("Price setter")

  await input.press("Enter")
  await expect(page.getByTestId("workflow-search-counter")).toHaveText("2 / 4")
  await expect(currentField.locator("input")).toHaveValue("price")
  await expect(setter.getByText("Price setter")).toHaveAttribute(
    "data-field-search-state",
    "match"
  )
  // The node keeps a lighter current-node mark while the field holds the
  // strong one.
  await expect(setter).toHaveAttribute("data-search-state", "current")

  await input.press("Escape")
  await expect(page.locator("[data-field-search-state]")).toHaveCount(0)
})

async function importGraph(page: Page, workflow: unknown) {
  await page.goto("/")
  await page.getByRole("button", { name: "Import JSON" }).click()
  await page
    .getByPlaceholder("Paste domain workflow JSON")
    .fill(JSON.stringify(workflow))
  await page.getByRole("button", { name: "Apply Import" }).click()
  await expect(page.getByText("Workflow imported.")).toBeVisible()
  await page.getByRole("button", { name: "Close Import" }).click()
}

async function openSearch(page: Page, query: string) {
  await page.locator(".react-flow__pane").click({ position: { x: 40, y: 40 } })
  await page.keyboard.press("ControlOrMeta+f")
  const input = page.getByLabel("Search nodes and variables")
  await input.fill(query)
  return input
}

test("the results panel lists matches and jumps to a picked one", async ({
  page,
}) => {
  await importWorkflow(page)
  const input = await openSearch(page, "price")
  const counter = page.getByTestId("workflow-search-counter")

  await counter.click()
  const results = page.getByTestId("workflow-search-result")
  await expect(results).toHaveCount(3)
  await expect(results.nth(2)).toContainText("Condition 1 · Left operand")

  const before = await viewportTransform(page)
  await results.nth(2).click()
  await expect(counter).toHaveText("3 / 3")
  await expect(
    page.locator('[data-node-id="evaluator-1"][data-search-state="current"]')
  ).toHaveCount(1)
  await expect.poll(() => viewportTransform(page)).not.toBe(before)
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(0)

  // The panel stays open while the user works on the canvas.
  await page.locator(".react-flow__pane").click({ position: { x: 40, y: 40 } })
  await expect(page.getByTestId("workflow-search-results")).toBeVisible()

  await input.focus()
  await input.press("Shift+Enter")
  await expect(results.nth(1)).toHaveAttribute("aria-selected", "true")
})

test("source filters and whole word narrow the match set everywhere", async ({
  page,
}) => {
  const workflow = {
    ...WORKFLOW,
    nodes: WORKFLOW.nodes.map((node) =>
      node.id === "inline-1"
        ? {
            ...node,
            config: {
              ...node.config,
              template: ["{{ price }} {{ max_price }}"],
            },
          }
        : node
    ),
  }
  await importGraph(page, workflow)
  await openSearch(page, "price")
  const counter = page.getByTestId("workflow-search-counter")
  await expect(counter).toHaveText("1 / 4")

  await page.getByRole("button", { name: "Match whole word" }).click()
  await expect(counter).toHaveText("1 / 3")

  await counter.click()
  await page.getByRole("button", { name: /^Variables/ }).click()
  await expect(counter).toHaveText("1 / 2")
  await expect(page.getByTestId("workflow-search-filtered")).toBeVisible()
  await expect(
    page.locator('[data-node-id="setter-1"][data-search-state]')
  ).toHaveCount(0)

  await page.getByRole("button", { name: /^References/ }).click()
  await expect(page.getByTestId("workflow-search-empty")).toContainText(
    "3 matches hidden by filters"
  )
  await page.getByRole("button", { name: "Reset filters" }).click()
  // Filtering moved the current match past the definition; resetting keeps
  // the user where they are rather than jumping back.
  await expect(counter).toHaveText("2 / 3")
})

test("the results panel scrolls the current match into view", async ({
  page,
}) => {
  const nodes = Array.from({ length: 30 }, (_, index) => ({
    id: `inline-${index}`,
    kind: "inlineExpression",
    position: { x: 0, y: index * 200 },
    label: `Message ${index}`,
    config: {
      template: ["{{ price }}"],
      isRoot: index === 0,
      repeatable: false,
      caseSensitive: false,
    },
  }))
  await importGraph(page, { ...WORKFLOW, nodes, connections: [] })
  const input = await openSearch(page, "price")
  const counter = page.getByTestId("workflow-search-counter")
  await expect(counter).toHaveText("1 / 30")
  await counter.click()

  await input.focus()
  await input.press("Shift+Enter")
  await expect(counter).toHaveText("30 / 30")

  const current = page.locator(
    '[data-testid="workflow-search-result"][aria-selected="true"]'
  )
  await expect(current).toContainText("30")
  await expect(current).toBeInViewport()
})
