import { expect, test } from "@playwright/test"

import { openTourChain } from "./chain"
import { glide, pause, placePointer, recordTourStep } from "./recorder"

// Narrower than the gap between chain nodes, so no neighbour shows at the edge.
const CROP_SIDE_MARGIN = 70

// Tour step "workflow-selection": hold Shift and drag a box across the canvas
// to select the middle of the /tour/chain chain.
test("record workflow-selection", async ({ browser }) => {
  await recordTourStep(browser, "workflow-selection", async (recorder) => {
    const { page } = recorder
    const { boxes, top, bottom } = await openTourChain(page)
    const { "tour-extract": extract, "tour-setter": setter } = boxes

    // Frame just the two nodes being selected: the tour panel shows the clip
    // at about 400px wide, and the whole chain shrinks there to unreadable.
    // Room above for the selection toolbar, below for the key caption.
    const left = extract.x - CROP_SIDE_MARGIN
    recorder.setCrop({
      x: left,
      y: top - 110,
      width: setter.x + setter.width + CROP_SIDE_MARGIN - left,
      height: bottom - top + 110 + 112,
    })

    // The box starts in the empty gap left of Extractor and ends past Setter.
    const boxFrom = { x: extract.x - 28, y: top - 36 }
    const boxTo = { x: setter.x + setter.width + 28, y: bottom + 36 }

    await placePointer(page, { x: boxFrom.x - 20, y: bottom + 70 })
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
