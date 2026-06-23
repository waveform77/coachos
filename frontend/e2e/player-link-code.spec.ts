import { test, expect } from "@playwright/test";

test.describe("Player links profile by code", () => {
  test("coach creates a player and generates a code; new player user links via UI", async ({ page, request }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    const apiBase = 'http://localhost:8080/api/v1';

    // 1. Login as demo admin to get a token
    const adminLogin = await request.post(`${apiBase}/auth/login`, {
      data: { email: 'admin@coachos.dev', password: 'Admin123!' },
    });
    expect(adminLogin.ok()).toBeTruthy();
    const admin = await adminLogin.json();
    const adminToken = admin.accessToken;
    const clubId = admin.user.clubId;

    // 2. Create a player card in the admin's club
    const unique = Date.now().toString();
    const playerPayload = {
      firstName: 'Link',
      lastName: `Test ${unique.slice(-4)}`,
      position: 'forward',
      dominantFoot: 'right',
      birthDate: '2010-01-01T00:00:00Z',
    };
    const createPlayer = await request.post(`${apiBase}/players`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: playerPayload,
    });
    expect(createPlayer.ok()).toBeTruthy();
    const player = await createPlayer.json();

    // 3. Generate a link code for the player
    const generateCode = await request.post(`${apiBase}/coach/link-codes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { playerId: player.id },
    });
    expect(generateCode.ok()).toBeTruthy();
    const { code } = await generateCode.json();
    expect(code).toHaveLength(6);

    // 4. Register a new player-role user
    const playerEmail = `player-link-${unique}@coachos.dev`;
    const register = await request.post(`${apiBase}/auth/register`, {
      data: {
        email: playerEmail,
        password: 'Player123!',
        firstName: 'Linked',
        lastName: 'Player',
        role: 'player',
      },
    });
    expect(register.ok()).toBeTruthy();

    // 5. Login via UI as the new player
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', playerEmail);
    await page.fill('input[type="password"]', 'Player123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/me/**', { timeout: 10000 });

    // 6. Navigate to link-code page and enter the code
    await page.goto("http://localhost:3000/me/link-code");
    await page.fill('input[placeholder*="6"]', code);
    await page.click('button[type="submit"]');

    // 7. Expect success state and redirect
    await expect(page.locator('main').getByText(/Профиль привязан!|Profile linked!/i)).toBeVisible({ timeout: 5000 });
    await page.waitForURL('**/me/**', { timeout: 10000 });

    // 8. Open schedule — should not show 400 error after token refresh
    await page.goto("http://localhost:3000/me/schedule");
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Расписание|Schedule/i').first()).toBeVisible();
    await expect(page.locator('text=/ошибка|error|400/i')).not.toBeVisible();

    // 9. Verify the player card now has the linked user
    const loginAgain = await request.post(`${apiBase}/auth/login`, {
      data: { email: playerEmail, password: 'Player123!' },
    });
    const { accessToken } = await loginAgain.json();
    const me = await request.get(`${apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = await me.json();
    expect(meData.clubId).toBe(clubId);

    await page.screenshot({ path: `/tmp/player-link-code-${unique}.png` });
  });
});
