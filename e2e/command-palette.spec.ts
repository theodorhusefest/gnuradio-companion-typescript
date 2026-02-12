import { expect, test } from "@playwright/test";

test.describe("Command palette", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".react-flow");
  });

  test("should open with Cmd+K and close with Escape", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(
      page.getByPlaceholder("Search blocks and actions..."),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByPlaceholder("Search blocks and actions..."),
    ).not.toBeVisible();
  });

  test("should show Save and Open actions", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.getByRole("option", { name: /Save/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Open/ })).toBeVisible();
  });

  test("should filter blocks by search query", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    const input = page.getByPlaceholder("Search blocks and actions...");
    await input.fill("AGC");

    const items = page.locator("[cmdk-item]");
    // Should have at least one AGC block result plus possible action matches
    await expect(items.first()).toBeVisible();

    // Verify AGC blocks appear in the results
    await expect(
      page.getByRole("option", { name: /AGC/ }).first(),
    ).toBeVisible();
  });

  test("should add a block to the canvas when selected", async ({ page }) => {
    await expect(page.locator(".react-flow__node")).toHaveCount(0);

    await page.keyboard.press("Meta+k");
    const input = page.getByPlaceholder("Search blocks and actions...");
    await input.fill("AGC");

    const blockItem = page.getByRole("option", { name: /AGC/ }).first();
    await blockItem.click();

    // Dialog should close
    await expect(input).not.toBeVisible();

    // A node should appear on the canvas
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
  });
});
