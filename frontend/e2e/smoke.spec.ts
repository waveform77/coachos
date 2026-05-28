import { test, expect } from "@playwright/test";

test.describe("CoachOS smoke", () => {
  test("landing or login page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
