import { test, expect } from "@playwright/test";

test.describe("Admin creates a coach", () => {
  test("login as admin and create a coach user", async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', 'admin@coachos.dev');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/**', { timeout: 10000 });

    await page.goto("http://localhost:3000/admin/users");
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Добавить")');
    await page.waitForTimeout(500);

    const unique = Date.now().toString();
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'Coach');
    await page.fill('input[type="email"]', `e2e-coach-${unique}@coachos.dev`);
    await page.fill('input[name="password"]', 'Coach123!');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await expect(page.locator(`text=e2e-coach-${unique}@coachos.dev`)).toBeVisible();
    await page.screenshot({ path: `/tmp/admin-create-coach-${unique}.png` });
  });
});
