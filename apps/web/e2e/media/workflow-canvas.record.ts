import { expect, test } from "@playwright/test"

import {
  centerOf,
  glide,
  pause,
  placePointer,
  recordTourStep,
} from "./recorder"

// Tour step "workflow-canvas": connect the sample Keyword node to a Setter by
// dragging from its output handle to the Setter's input handle.
test("record workflow-canvas", async ({ browser }) => {
  await recordTourStep(browser, "workflow-canvas", async (recorder) => {
    const { page } = recorder
    await page.goto("/")

    const palette = page.getByRole("complementary", { name: "Node palette" })
    const nodes = page.getByTestId("workflow-node")
    const edges = page.locator(".react-flow__edge")
    const keywordNode = nodes.first()
    const setterCard = palette.getByRole("button", { name: "Add Setter node" })
    const canvas = page.getByRole("region", { name: "Workflow canvas" })
    await expect(keywordNode).toBeVisible()
    await expect(setterCard).toBeVisible()

    // Setup, cut from the clip. Pan the graph away from the toolbar and the
    // config panel, so the crop has margins without catching their edges.
    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) {
      throw new Error("Workflow canvas is not visible")
    }
    const panFrom = {
      x: canvasBox.x + canvasBox.width * 0.5,
      y: canvasBox.y + canvasBox.height * 0.5,
    }
    await placePointer(page, panFrom)
    await page.mouse.down()
    await page.mouse.move(panFrom.x + 120, panFrom.y + 110, { steps: 10 })
    await page.mouse.up()

    const keywordBox = await keywordNode.boundingBox()
    if (!keywordBox) {
      throw new Error("The sample Keyword node is not visible")
    }

    // Drop a Setter to the right of the Keyword node so there is something
    // to connect to, then put the palette away.
    const setterDropAt = {
      x: keywordBox.x + keywordBox.width + 170,
      y: keywordBox.y + 90,
    }
    await placePointer(page, await centerOf(setterCard))
    await page.mouse.down()
    await page.mouse.move(setterDropAt.x, setterDropAt.y, { steps: 20 })
    await page.mouse.up()
    await expect(nodes).toHaveCount(2)
    await page.getByRole("button", { name: "Hide node palette" }).click()
    await expect(palette).toBeHidden()
    const setterNode = nodes.last()
    const initialEdgeCount = await edges.count()

    // Clear the selection the drop left behind, so the clip starts neutral.
    await page.keyboard.press("Escape")
    const sourceHandle = keywordNode.locator(".react-flow__handle-right")
    const targetHandle = setterNode.locator(".react-flow__handle-left")
    const setterBox = await setterNode.boundingBox()
    if (!setterBox) {
      throw new Error("The dropped Setter node is not visible")
    }

    const left = keywordBox.x - 40
    const top = keywordBox.y - 40
    recorder.setCrop({
      x: left,
      y: top,
      width: setterBox.x + setterBox.width + 60 - left,
      height:
        Math.max(
          keywordBox.y + keywordBox.height,
          setterBox.y + setterBox.height
        ) +
        60 -
        top,
    })

    // Start in the gap between the nodes, so the way to the handle does not
    // cross (and hover) the Keyword node's controls.
    await placePointer(page, {
      x: keywordBox.x + keywordBox.width + 70,
      y: keywordBox.y + keywordBox.height + 10,
    })
    await recorder.markStart()
    await pause(page, 700)

    await glide(page, await centerOf(sourceHandle), 700)
    await pause(page, 300)
    await page.mouse.down()
    await glide(page, await centerOf(targetHandle), 1100)
    await pause(page, 150)
    await page.mouse.up()
    await expect(edges).toHaveCount(initialEdgeCount + 1)

    await pause(page, 400)
    await glide(
      page,
      { x: setterBox.x + setterBox.width * 0.5, y: setterBox.y - 20 },
      500
    )
    await pause(page, 1500)
  })
})
