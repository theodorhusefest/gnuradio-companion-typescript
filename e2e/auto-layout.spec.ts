import { expect, Page, test } from "@playwright/test";

async function addBlockToCanvas(
  page: Page,
  searchTerm: string,
  offsetX = 0,
  offsetY = 0,
) {
  const canvas = page.locator(".react-flow");
  const canvasBounds = await canvas.boundingBox();

  const searchInput = page.getByPlaceholder("Search blocks...");
  await searchInput.fill(searchTerm);

  const blockItem = page.locator('[draggable="true"]').first();
  await blockItem.waitFor({ state: "visible" });

  await blockItem.dragTo(canvas, {
    targetPosition: {
      x: canvasBounds!.width / 2 + offsetX,
      y: canvasBounds!.height / 2 + offsetY,
    },
  });

  await searchInput.clear();
}

test.describe("Auto Layout functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".react-flow");
  });

  test("should show Auto Layout option in context menu", async ({ page }) => {
    const canvas = page.locator(".react-flow");
    await canvas.click({ button: "right" });

    await expect(
      page.getByRole("menuitem", { name: /Auto Layout/ }),
    ).toBeVisible();
  });

  test("should apply layout via toolbar button", async ({ page }) => {
    // Add blocks at scattered positions (using AGC variants from fixture)
    await addBlockToCanvas(page, "AGC2", -100, -50);
    await addBlockToCanvas(page, "AGC3", 100, 50);

    // Click the auto layout button
    const layoutBtn = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-align-start-vertical") });
    await layoutBtn.click();

    // Wait for layout
    await page.waitForTimeout(300);

    // Verify nodes are still present
    await expect(page.locator(".react-flow__node")).toHaveCount(2);
  });
});
