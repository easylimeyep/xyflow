import { expect, test } from "@playwright/test"

import { openTourChain } from "./chain"
import { glide, pause, placePointer, recordTourStep } from "./recorder"

// Tour step "workflow-selection": hold Shift and drag a box across the canvas
// to select the middle of the /tour/chain chain.
test("record workflow-selection", async ({ browser }) => {
  await recordTourStep(browser, "workflow-selection", async (recorder) => {
    const { page } = recorder
    const { boxes, top, bottom } = await openTourChain(page)
    const { "tour-keyword": keyword, "tour-extract": extract } = boxes
    const { "tour-setter": setter, "tour-result": result } = boxes

    // Room above for the selection toolbar, below for the key caption.
    const left = keyword.x - 40
    recorder.setCrop({
      x: left,
      y: top - 110,
      width: result.x + result.width + 40 - left,
      height: bottom - top + 110 + 112,
    })

    // The box starts in the empty gap left of Extractor and ends past Setter.
    const boxFrom = { x: extract.x - 28, y: top - 36 }
    const boxTo = { x: setter.x + setter.width + 28, y: bottom + 36 }

    await placePointer(page, { x: boxFrom.x - 60, y: bottom + 70 })
    await recorder.markStart()
    await pause(page, 800)

    await glide(page, boxFrom, 700)
    await pause(page, 200)
    await page.keyboard.down("Shift")
    await recorder.showKeys(["⇧ Shift", "Drag"])
    await pause(page, 500)
    await page.mouse.down()
    await glide(page, boxTo, 1100)
    await pause(page, 200)
    await page.mouse.up()
    await page.keyboard.up("Shift")
    await expect(page.locator(".react-flow__node.selected")).toHaveCount(2)

    await pause(page, 500)
    await recorder.hideKeys()
    await glide(page, { x: boxTo.x + 40, y: boxTo.y + 30 }, 500)
    await pause(page, 1600)
  })
})
