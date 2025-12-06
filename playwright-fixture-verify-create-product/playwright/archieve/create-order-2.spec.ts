import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
    await page.goto('https://localhost:5001/menu/Sell');
    await page.locator('a').filter({ hasText: 'DUKU - P0000111' }).click();
    await page.getByRole('button', { name: 'Pay (1 Items)' }).click();
    await page.getByRole('button', { name: 'Ok (F2)' }).click();
    await expect(page.getByRole('heading', { name: 'Order Complete' })).toBeVisible();
});

