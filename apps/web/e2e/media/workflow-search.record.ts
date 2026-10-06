import { expect, test } from "@playwright/test"

import {
  RECORDING_VIEWPORT,
  centerOf,
  glide,
  pause,
  placePointer,
  recordTourStep,
} from "./recorder"

const QUERY = "total"
const TYPING_DELAY_MS = 110

// Tour step "workflow-search": Ctrl+F, type a query, step through matches
// with Enter, then open the full list from the counter and jump to a match.
test("record workflow-search", async ({ browser }) => {
  await recordTourStep(browser, "workflow-search", async (recorder) => {
    const { page } = recorder
    await page.goto("/tour/search")

    const canvas = page.getByRole("region", { name: "Workflow canvas" })
    const counter = page.getByTestId("workflow-search-counter")
    const results = page.getByRole("listbox", { name: "Search results" })
    await expect(page.getByTestId("workflow-node")).toHaveCount(5)
    await page.getByRole("button", { name: "Hide node palette" }).click()
    // The page lays the chain out once nodes are measured.
    await expect(
      page.locator('.react-flow__node[data-id="search-result"]')
    ).not.toHaveCSS("transform", /translate\(0px, 0px\)/)
    await page.getByRole("button", { name: "Fit view" }).click()
    await pause(page, 600)

    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) {
      throw new Error("Workflow canvas is not visible")
    }
    // The search bar and its results drop from the top of the canvas.
    recorder.setCrop({
      x: canvasBox.x,
      y: 0,
      width: canvasBox.width,
      // Stop above the minimap in the bottom-left corner.
      height: RECORDING_VIEWPORT.height - 240,
    })

    // Focus the canvas so Ctrl+F reaches the editor.
    const restAt = {
      x: canvasBox.x + canvasBox.width * 0.72,
      y: canvasBox.y + canvasBox.height * 0.72,
    }
    await placePointer(page, restAt)
    await page.mouse.click(restAt.x, restAt.y)
    await recorder.markStart()
    await pause(page, 700)

    await recorder.showKeys(["Ctrl", "F"])
    await pause(page, 250)
    await page.keyboard.press("Control+F")
    await pause(page, 600)
    await recorder.hideKeys()

    await page.keyboard.type(QUERY, { delay: TYPING_DELAY_MS })
    await expect(counter).toHaveText(/1\s*\/\s*7/)
    await pause(page, 1000)

    await recorder.showKeys(["Enter"])
    await pause(page, 250)
    await page.keyboard.press("Enter")
    await pause(page, 800)
    await page.keyboard.press("Enter")
    await expect(counter).toHaveText(/3\s*\/\s*7/)
    await pause(page, 700)
    await recorder.hideKeys()

    // Let the counter's "Show all matches" tooltip come up, then open it.
    await glide(page, await centerOf(counter), 800)
    await pause(page, 900)
    await page.mouse.down()
    await pause(page, 80)
    await page.mouse.up()
    await expect(results).toBeVisible()
    await pause(page, 1100)

    const extractorRow = results.getByRole("option").filter({
      hasText: /^7/,
    })
    await glide(page, await centerOf(extractorRow), 900)
    await pause(page, 300)
    await page.mouse.down()
    await pause(page, 80)
    await page.mouse.up()
    await expect(counter).toHaveText(/7\s*\/\s*7/)
    await pause(page, 900)

    // The canvas has moved to Extractor under the open list; fold the list
    // away to show it.
    await glide(page, await centerOf(counter), 700)
    await pause(page, 250)
    await page.mouse.down()
    await pause(page, 80)
    await page.mouse.up()
    await expect(results).toBeHidden()
    await glide(page, { x: restAt.x, y: restAt.y - 60 }, 700)
    await pause(page, 1600)
  })
})
