import { test, expect, request, Page } from '@playwright/test';
import { tokenUtil } from '../../tests/util';
import { faker } from '@faker-js/faker';

let page: Page;
let token = ''
let outlet = 'Outlet1'
let salesNumber = ''
let billNumber = ''
let productNameNCode = faker.commerce.productName()

test.beforeAll(async ({ browser, request }) => {
    page = await browser.newPage();
    const tokenLocalStorage = tokenUtil(await request.storageState())
    token = tokenLocalStorage
});

test('create product', async () => {
    await page.goto('https://localhost:5001/menu/Products/Catalog/Products');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Name').click();
    await page.getByPlaceholder('Name').fill(productNameNCode);
    await page.waitForResponse('**/product/IsUnique')
    await page.getByPlaceholder('Code').click();
    await page.getByPlaceholder('Code').fill(productNameNCode);
    await page.waitForResponse('**/product/IsUnique')
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForResponse('**/product/SubmitProduct')
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible({ timeout: 50000 });
});

test('buy', async () => {
    await page.getByRole('link', { name: ' Buy' }).click();
    await page.waitForResponse('**/Buy2/Load')
    await page.getByPlaceholder('Search product by name/code').click();
    await page.getByPlaceholder('Search product by name/code').fill(productNameNCode);
    await page.locator('#mat-option-0').click();
    await page.getByRole('button', { name: 'Pay (1 Items & 1 Qty)' }).click();
    await page.getByRole('button', { name: 'Ok (F2)' }).click();
    const response = await page.waitForResponse('**/Buy/SubmitOrder2')
    await response.json().then(data => billNumber = data.InvoiceNumber)
    await expect(page.getByRole('heading', { name: ' Purchase Complete (Paid)' })).toBeVisible();
});

test('sell', async () => {
    await page.getByRole('link', { name: ' Sell' }).click();
    await page.waitForResponse('**/POS/LoadPOS')
    await page.getByRole('combobox', { name: 'Search product by name / code' }).fill(productNameNCode);
    await page.getByRole('option', { name: ` ${productNameNCode}` }).click();
    await page.getByRole('button', { name: 'Pay (1 Items)' }).click();
    await page.getByRole('button', { name: 'Ok (F2)' }).click();
    const response = await page.waitForResponse('**/POS/SubmitOrder')
    await response.json().then(data => salesNumber = data.InvoiceNumber)
    await expect(page.getByRole('heading', { name: 'Order Complete' })).toBeVisible();
})

// clean up state - best practice to do e2e testing
test('clean up', async ({ request }) => {
    const deleteBill = await request.delete('https://localhost:5001/api/v3/Bill', {
        data: {
            Outlet: outlet,
            Number: billNumber
        },
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    expect(deleteBill.ok()).toBeTruthy();
    const deleteSalesOrder = await request.delete('https://localhost:5001/api/v3/SalesOrder', {
        data: {
            Outlet: outlet,
            Number: salesNumber
        },
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    expect(deleteSalesOrder.ok()).toBeTruthy();
    const deleteProduct = await request.delete('https://localhost:5001/api/v3/Product', {
        data: {
            Code: productNameNCode
        },
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    expect(deleteProduct.ok()).toBeTruthy();
});