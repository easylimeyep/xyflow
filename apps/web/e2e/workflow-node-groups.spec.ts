import { expect, test, type Locator, type Page } from "@playwright/test"

/**
 * Two setters side by side and a result far to the right, pasted as a
 * selection: the setters get grouped, the result stays outside.
 */
const SELECTION = {
  kind: "workflow-selection-v1",
  nodes: [
    {
      id: "setter-a",
      kind: "setVariable",
      position: { x: 0, y: 0 },
      label: "Price",
      config: {
        variableName: "price",
        variableType: "value",
        valueExpression: "10",
        clear: false,
      },
    },
    {
      id: "setter-b",
      kind: "setVariable",
      position: { x: 0, y: 320 },
      label: "Total",
      config: {
        variableName: "total",
        variableType: "value",
        valueExpression: "{{ price }}",
        clear: false,
      },
    },
    {
      id: "result-1",
      kind: "result",
      position: { x: 900, y: 0 },
      label: "Done",
      config: { category: "true" },
    },
  ],
  connections: [
    {
      id: "a-b",
      sourceNodeId: "setter-a",
      targetNodeId: "setter-b",
      sourceHandle: null,
      targetHandle: null,
    },
  ],
}

async function pasteSelection(page: Page) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/")
  await expect(
    page.getByRole("region", { name: "Workflow canvas" })
  ).toBeVisible()
  await page.evaluate(
    (text) => navigator.clipboard.writeText(text),
    JSON.stringify(SELECTION)
  )
  // Paste below the sample keyword node, so the pasted nodes do not overlap it.
  await page
    .locator(".react-flow__pane")
    .click({ position: { x: 120, y: 420 } })
  // The pointer position the paste anchors to is recorded once per frame.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  )
  await page.keyboard.press("ControlOrMeta+v")
  await expect(page.getByTestId("workflow-node")).toHaveCount(4)
  await page.getByRole("button", { name: "Fit view" }).click()
}

const frame = (page: Page) =>
  page.locator('.react-flow__node[data-id^="group-frame:"]')
const header = (page: Page) =>
  frame(page).locator(".workflow-group-drag-handle")
const nodeByLabel = (page: Page, label: string) =>
  page
    .getByTestId("workflow-node")
    .filter({ has: page.getByText(label, { exact: true }) })
    .first()

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  if (!result) throw new Error("element has no box")
  return result
}

async function dragBy(
  page: Page,
  from: { x: number; y: number },
  dx: number,
  dy: number
) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 10 })
  await page.mouse.up()
}

/** A spot right of the minimap, left of the palette, below the nodes. */
async function clickEmptyPane(page: Page) {
  const pane = await box(page.locator(".react-flow__pane"))
  await page.mouse.click(pane.x + 450, pane.y + pane.height - 30)
}

/** Groups the two pasted setters with Mod+G; "Done" stays outside. */
async function groupSetters(page: Page) {
  // The paste left all three selected.
  await clickEmptyPane(page)
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(0)
  // A box selection over the two setters; "Done" sits far to the right.
  const price = await box(nodeByLabel(page, "Price"))
  const totalBox = await box(nodeByLabel(page, "Total"))
  await page.keyboard.down("Shift")
  await page.mouse.move(price.x - 15, price.y - 15)
  await page.mouse.down()
  await page.mouse.move(totalBox.x + 40, totalBox.y + 40, { steps: 8 })
  await page.mouse.up()
  await page.keyboard.up("Shift")
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(2)
  await page.keyboard.press("ControlOrMeta+g")
  await expect(frame(page)).toHaveCount(1)
  await expect(
    page.getByRole("group", { name: "Group Group 1, 2 nodes" })
  ).toBeVisible()
}

test("groups a selection and edits, collapses, and deletes the group", async ({
  page,
}) => {
  await pasteSelection(page)
  await groupSetters(page)

  // Rename inline.
  await header(page).dblclick({ position: { x: 30, y: 15 } })
  await page.getByLabel("Group name").fill("Pricing")
  await page.keyboard.press("Enter")
  await expect(frame(page).getByTestId("workflow-group-title")).toHaveText(
    "Pricing"
  )

  // Drag the header: members move with it.
  const priceBefore = await box(nodeByLabel(page, "Price"))
  const headerBox = await box(header(page))
  await dragBy(page, { x: headerBox.x + 40, y: headerBox.y + 12 }, 0, 80)
  const priceAfter = await box(nodeByLabel(page, "Price"))
  expect(priceAfter.y).toBeGreaterThan(priceBefore.y + 20)

  // Resize from the left edge: members stay where they are.
  await header(page).click({ position: { x: 30, y: 15 } })
  const frameBefore = await box(frame(page))
  const leftEdge = await box(
    frame(page).locator(".react-flow__resize-control.line.left")
  )
  // Just below the header: the Price → Total edge loops past the middle of
  // the left edge, and edges draw over frames.
  const headerHeight = (await box(header(page))).height
  await dragBy(
    page,
    { x: leftEdge.x + leftEdge.width / 2, y: leftEdge.y + headerHeight + 15 },
    -60,
    0
  )
  const frameAfter = await box(frame(page))
  expect(frameAfter.x).toBeLessThan(frameBefore.x - 20)
  expect(Math.round(frameAfter.x + frameAfter.width)).toBe(
    Math.round(frameBefore.x + frameBefore.width)
  )
  expect((await box(nodeByLabel(page, "Price"))).x).toBeCloseTo(priceAfter.x, 0)

  // Drag "Total" out of the frame: it leaves, the group stays.
  const total = await box(nodeByLabel(page, "Total"))
  const frameNow = await box(frame(page))
  // Grabbed by its right end (the minimap overlays its left end) and moved
  // sideways, so the drop stays in the window with the center right of the
  // frame.
  const grab = { x: total.x + total.width - 20, y: total.y + 8 }
  await dragBy(page, grab, frameNow.x + frameNow.width - total.x + 40, 0)
  await expect(
    page.getByRole("group", { name: "Group Pricing, 1 node" })
  ).toBeVisible()

  // Collapse, then expand.
  await clickEmptyPane(page)
  await frame(page).getByRole("button", { name: "Collapse group" }).click()
  await expect(page.getByTestId("workflow-group-card")).toBeVisible()
  await expect(nodeByLabel(page, "Price")).toBeHidden()
  await page
    .getByTestId("workflow-group-card")
    .getByRole("button", { name: "Expand group" })
    .click()
  await expect(page.getByTestId("workflow-group-frame")).toBeVisible()
  await expect(nodeByLabel(page, "Price")).toBeVisible()

  // Delete the group with its member, then undo in one step.
  await header(page).click({ position: { x: 30, y: 15 } })
  await page
    .getByTestId("selection-toolbar")
    .getByRole("button", { name: "Delete" })
    .click()
  await expect(frame(page)).toHaveCount(0)
  await expect(page.getByTestId("workflow-node")).toHaveCount(3)

  await clickEmptyPane(page)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(frame(page)).toHaveCount(1)
  await expect(page.getByTestId("workflow-node")).toHaveCount(4)
  await expect(frame(page).getByTestId("workflow-group-title")).toHaveText(
    "Pricing"
  )
})

test("arranges a group along its edges and undoes in one step", async ({
  page,
}, testInfo) => {
  await pasteSelection(page)
  await groupSetters(page)
  // The setters are stacked: Total sits below Price.
  const priceBefore = await box(nodeByLabel(page, "Price"))
  const totalBefore = await box(nodeByLabel(page, "Total"))
  const doneBefore = await box(nodeByLabel(page, "Done"))
  expect(totalBefore.y).toBeGreaterThan(priceBefore.y + priceBefore.height)
  await page.screenshot({ path: testInfo.outputPath("arrange-before.png") })

  await frame(page).getByRole("button", { name: "Arrange" }).click()

  // Price → Total is laid out left to right, and the setters' bounds keep
  // their top-left corner.
  await expect
    .poll(async () => (await box(nodeByLabel(page, "Total"))).x)
    .toBeGreaterThan(priceBefore.x + priceBefore.width)
  const price = await box(nodeByLabel(page, "Price"))
  const total = await box(nodeByLabel(page, "Total"))
  expect(Math.min(price.x, total.x)).toBeCloseTo(
    Math.min(priceBefore.x, totalBefore.x),
    0
  )
  expect(Math.min(price.y, total.y)).toBeCloseTo(
    Math.min(priceBefore.y, totalBefore.y),
    0
  )
  expect(Math.abs(total.y - price.y)).toBeLessThan(priceBefore.height)
  // The frame wraps both setters; "Done" outside the group did not move.
  const fitted = await box(frame(page))
  expect(fitted.x).toBeLessThan(price.x)
  expect(fitted.x + fitted.width).toBeGreaterThan(total.x + total.width)
  expect(await box(nodeByLabel(page, "Done"))).toEqual(doneBefore)
  await page.screenshot({ path: testInfo.outputPath("arrange-after.png") })

  await clickEmptyPane(page)
  await page.keyboard.press("ControlOrMeta+z")
  await expect
    .poll(async () => (await box(nodeByLabel(page, "Total"))).y)
    .toBeCloseTo(totalBefore.y, 0)
  expect((await box(nodeByLabel(page, "Total"))).x).toBeCloseTo(
    totalBefore.x,
    0
  )
})
