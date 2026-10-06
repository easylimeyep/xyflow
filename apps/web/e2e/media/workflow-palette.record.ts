import { expect, test } from "@playwright/test"

import {
  centerOf,
  glide,
  pause,
  placePointer,
  recordTourStep,
} from "./recorder"

// Tour step "workflow-palette": drag a Setter card from the palette onto an
// empty spot of the canvas.
test("record workflow-palette", async ({ browser }) => {
  await recordTourStep(browser, "workflow-palette", async (recorder) => {
    const { page } = recorder
    await page.goto("/")

    const palette = page.getByRole("complementary", { name: "Node palette" })
    const canvas = page.getByRole("region", { name: "Workflow canvas" })
    const nodes = page.getByTestId("workflow-node")
    const setterCard = palette.getByRole("button", { name: "Add Setter node" })
    await expect(setterCard).toBeVisible()
    const initialNodeCount = await nodes.count()

    const canvasBox = await canvas.boundingBox()
    const paletteBox = await palette.boundingBox()
    const cardCenter = await centerOf(setterCard)
    if (!canvasBox || !paletteBox) {
      throw new Error("Workflow canvas or palette is not visible")
    }
    // Drop in the empty strip left of the palette, so the new node lands in
    // open space and the crop below clears the sample graph and minimap.
    const dropAt = {
      x: paletteBox.x - 330,
      y: canvasBox.y + canvasBox.height * 0.68,
    }

    // Frame the palette and the drop spot; the rest of the editor is noise
    // at the size a tour popover shows the clip.
    const left = dropAt.x - 60
    recorder.setCrop({
      x: left,
      y: paletteBox.y,
      width: paletteBox.x + paletteBox.width + 12 - left,
      height: dropAt.y + 190 - paletteBox.y,
    })

    await placePointer(page, { x: dropAt.x + 60, y: dropAt.y - 120 })
    await recorder.markStart()
    await pause(page, 700)

    await glide(page, cardCenter, 700)
    await pause(page, 300)
    await page.mouse.down()
    await glide(page, dropAt, 1100)
    await pause(page, 150)
    await page.mouse.up()
    await expect(nodes).toHaveCount(initialNodeCount + 1)

    await pause(page, 400)
    await glide(page, { x: dropAt.x + 150, y: dropAt.y + 120 }, 500)
    await pause(page, 1500)
  })
})
