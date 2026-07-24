import { expect, test } from "@playwright/test"

test("workflow editor smoke surface supports basic browser actions", async ({
  page,
}) => {
  await page.goto("/")

  const nodePalette = page.getByRole("complementary", {
    name: "Node palette",
  })
  await expect(nodePalette).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Workflow canvas" })
  ).toBeVisible()
  await expect(page.getByLabel("Workflow config panel")).toBeVisible()

  const initialNodeCount = await page.getByTestId("workflow-node").count()

  await page.getByRole("button", { name: "Add Setter node" }).click()
  await expect(page.getByTestId("workflow-node")).toHaveCount(
    initialNodeCount + 1
  )

  await page.getByTestId("workflow-node").last().click()
  await expect(page.getByLabel("Workflow config panel")).toContainText("Setter")

  await page.getByRole("button", { name: "Hide node palette" }).click()
  await expect(nodePalette).toBeHidden()

  await page.getByRole("button", { name: "Show node palette" }).click()
  await expect(nodePalette).toBeVisible()
})
