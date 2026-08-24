import { expect, test } from "@playwright/test"

// Guards runtime observation mode: the canvas must stay byte-identical after a
// viewer attempts to drag a node, delete a node, and draw a connection. If a
// future affordance is added without gating it behind `mode`, this fails.
test("observe mode canvas cannot be mutated by drag, delete, or connect", async ({
  page,
}) => {
  await page.goto("/observe")

  await expect(
    page.getByRole("region", { name: "Workflow canvas" })
  ).toBeVisible()

  // The inspector replaces the config form; the palette is withheld entirely.
  await expect(page.getByLabel("Workflow config panel")).toContainText(
    "Inspector"
  )
  await expect(
    page.getByRole("complementary", { name: "Node palette" })
  ).toHaveCount(0)

  // Runtime overlay is rendered: a status badge and the loop counter appear.
  await expect(page.getByTestId("node-iteration-badge").first()).toContainText(
    "1 / 2"
  )

  const nodes = page.getByTestId("workflow-node")
  const initialNodeCount = await nodes.count()
  expect(initialNodeCount).toBe(3)

  const graphJson = page.getByTestId("observe-graph-json")
  const before = await graphJson.textContent()

  const firstNode = nodes.first()

  // 1. Attempt to delete: select a node, then press Delete and Backspace.
  await firstNode.click({ force: true })
  await page.keyboard.press("Delete")
  await page.keyboard.press("Backspace")

  // 2. Attempt to connect: drag from a source handle toward another node.
  const sourceHandle = page.locator(".react-flow__handle-right").first()
  const targetNode = nodes.nth(2)
  const sourceBox = await sourceHandle.boundingBox()
  const targetBox = await targetNode.boundingBox()
  if (sourceBox && targetBox) {
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2
    )
    await page.mouse.down()
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 12 }
    )
    await page.mouse.up()
  }

  // 3. Attempt to drag the first node (in observe mode this pans instead, which
  // does not change the graph model — only the viewport).
  const box = await firstNode.boundingBox()
  if (!box) {
    throw new Error("expected a bounding box for the first node")
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    box.x + box.width / 2 + 180,
    box.y + box.height / 2 + 120,
    { steps: 12 }
  )
  await page.mouse.up()

  // The graph must be unchanged after every attempted mutation.
  await expect(nodes).toHaveCount(initialNodeCount)
  const after = await graphJson.textContent()
  expect(after).toBe(before)
})
