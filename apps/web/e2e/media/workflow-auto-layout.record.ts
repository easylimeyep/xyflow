import { expect, test } from "@playwright/test"

import {
  RECORDING_VIEWPORT,
  centerOf,
  glide,
  pause,
  placePointer,
  recordTourStep,
} from "./recorder"

// Tour step "workflow-auto-layout": a scrambled chain (see the
// /tour/auto-layout fixture) snaps into a readable row on one click.
test("record workflow-auto-layout", async ({ browser }) => {
  await recordTourStep(browser, "workflow-auto-layout", async (recorder) => {
    const { page } = recorder
    await page.goto("/tour/auto-layout")

    const palette = page.getByRole("complementary", { name: "Node palette" })
    const canvas = page.getByRole("region", { name: "Workflow canvas" })
    const nodes = page.getByTestId("workflow-node")
    const autoLayoutButton = page.getByRole("button", {
      name: "Auto layout workflow",
    })
    await expect(nodes).toHaveCount(4)

    // The palette overlays the canvas; layout fits the view to the whole
    // canvas, so with the palette open the last node would land under it.
    await page.getByRole("button", { name: "Hide node palette" }).click()
    await expect(palette).toBeHidden()

    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) {
      throw new Error("Workflow canvas is not visible")
    }
    // Everything below the toolbar, down to the controls with the button.
    const top = canvasBox.y + 70
    recorder.setCrop({
      x: canvasBox.x,
      y: top,
      width: canvasBox.width,
      height: RECORDING_VIEWPORT.height - top,
    })

    await placePointer(page, {
      x: canvasBox.x + canvasBox.width * 0.45,
      y: canvasBox.y + canvasBox.height * 0.62,
    })
    await recorder.markStart()
    await pause(page, 1000)

    await glide(page, await centerOf(autoLayoutButton), 900)
    await pause(page, 350)
    await page.mouse.down()
    await pause(page, 90)
    await page.mouse.up()

    await pause(page, 600)
    await glide(
      page,
      {
        x: canvasBox.x + canvasBox.width * 0.5,
        y: canvasBox.y + canvasBox.height * 0.68,
      },
      700
    )
    await pause(page, 1600)
  })
})
