import { test as setup, expect, chromium } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';
const username = process.env.SYSTEM_USERNAME2 as string
const password = process.env.SYSTEM_PASSWORD2 as string
console.log('Login Success: (', username, password, ')')
setup('authenticate', async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto('https://playwright.dealpos.net/', { timeout: 15000, waitUntil: 'domcontentloaded' });
        await page.getByPlaceholder('Username').click({ timeout: 5000 });
        await page.getByPlaceholder('Username').fill(username, { timeout: 5000 });
        await page.getByPlaceholder('Username').press('Tab', { timeout: 5000 });
        await page.getByPlaceholder('Password').fill(password, { timeout: 5000 });
        await page.getByPlaceholder('Password').press('Enter', { timeout: 5000 });
        await page.waitForURL('https://playwright.dealpos.net/menu/Dashboard', { timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
        await page.context().storageState({ path: authFile });
    } catch (error) {
        console.error('Authentication setup failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
});