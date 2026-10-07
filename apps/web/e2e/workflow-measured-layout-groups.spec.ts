import { expect, test, type Page } from "@playwright/test"

// The measured initial layout waits for workflow nodes to report their size.
// The canvas nodes that draw groups (an expanded frame, a collapsed card) are
// never measured into the graph, so they must not hold the loader.

// Room for the ELK layout that runs once the nodes are measured.
const LAYOUT_TIMEOUT_MS = 15_000

function measuredLayoutLoader(page: Page) {
  return page
    .getByRole("status")
    .filter({ hasText: "Preparing measured layout" })
}

test("lays out a graph with an expanded group", async ({ page }) => {
  await page.goto("/fixtures/measured-groups/expanded")

  await expect(
    page.getByRole("region", { name: "Workflow canvas" })
  ).toBeVisible()
  await expect(measuredLayoutLoader(page)).toBeHidden({
    timeout: LAYOUT_TIMEOUT_MS,
  })
  await expect(
    page.getByTestId("workflow-node").filter({ hasText: "Extract total" })
  ).toBeVisible()
})

test("lays out a graph whose nodes are all in collapsed groups", async ({
  page,
}) => {
  await page.goto("/fixtures/measured-groups/collapsed")

  await expect(
    page.getByRole("region", { name: "Workflow canvas" })
  ).toBeVisible()
  await expect(measuredLayoutLoader(page)).toBeHidden({
    timeout: LAYOUT_TIMEOUT_MS,
  })
  await expect(page.getByText("Intake", { exact: true })).toBeVisible()
  await expect(page.getByText("Finish", { exact: true })).toBeVisible()
})
