import { test, expect } from "@playwright/test";

test.describe("SaaS onboarding", () => {
  test("register with club creation and land on admin dashboard", async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('response', res => {
      if (res.url().includes('/auth/register')) {
        console.log('REGISTER RESPONSE:', res.status(), res.url());
      }
    });

    const unique = Date.now().toString();
    await page.goto("http://localhost:3000/register");

    await page.fill('input[name="firstName"]', 'Onboarding');
    await page.fill('input[name="lastName"]', 'Admin');
    await page.fill('input[type="email"]', `saas-admin-${unique}@coachos.dev`);
    await page.fill('input[name="password"]', 'Admin123!');
    await page.fill('input[name="confirmPassword"]', 'Admin123!');

    // Enable club creation
    await page.getByRole('checkbox', { name: /Создать новый клуб/i }).check();
    await page.fill('input[name="clubName"]', `Academy ${unique}`);
    await page.fill('input[name="clubCity"]', 'Moscow');
    await page.fill('input[name="clubCountry"]', 'Russia');

    await page.click('button[type="submit"]');

    // Wait for navigation to admin dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    await expect(page.locator('text=/Dashboard|Панель управления|Команды|Тренеры/i').first()).toBeVisible();
    await page.screenshot({ path: `/tmp/onboarding-register-${unique}.png` });
  });
});
