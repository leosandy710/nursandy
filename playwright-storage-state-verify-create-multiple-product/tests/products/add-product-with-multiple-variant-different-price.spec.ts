import { test, Page, chromium, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

//Load config env variables
require('dotenv').config();
dotenv.config({ path: path.resolve(__dirname, 'sell', '.env') });

const PRODUCT = {
  initial: {
    name: 'Kaos Polos',
    code: 'KP',
    category: 'Kaos Polos',
    variants: [
      { name: 'Small', code: 'S001', cost: '50,000', price: '100,000' },
      { name: 'Medium', code: 'M001', cost: '75,000', price: '150,000' },
      { name: 'Large', code: 'L001', cost: '100,000', price: '200,000' }
    ]
  },
  update: {
    name: 'Kaos Blank',
    code: 'KB',
    category: 'Kaos Standard',
    variants: [
      { name: 'Red', code: 'R001', cost: '75,000', price: '150,000' },
      { name: 'Blue', code: 'B001', cost: '100,000', price: '200,000' },
      { name: 'Green', code: 'G001', cost: '125,000', price: '250,000' }
    ]
  }
};

function getTodayShortDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleString('en-US', { month: 'short' });
  const year = String(now.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
}
function getTodayLongDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleString('en-US', { month: 'short' });
  const year = String(now.getFullYear());
  return `${day} ${month} ${year}`;
}

test('Validate if Product List is Empty', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.waitForSelector('#tableGrid', { timeout: 10000 });
  const rowCount = await page.locator('#tableGrid > tbody > tr').count();
  expect(rowCount).toBe(0);
  console.log('✅ Product table is empty.'); // Log: Product table is empty
});


test('Create New Product Multiple Variant', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill(PRODUCT.initial.name);
  await page.getByRole('textbox', { name: 'Code' }).fill(PRODUCT.initial.code);
  await page.locator('#btnCategory').click();
  const dialog = page.locator('.modal-body');
  await dialog.getByRole('textbox', { name: 'Name' }).fill(PRODUCT.initial.category);
  await page.getByRole('button', { name: 'Ok (F2)' }).click();
  console.log(`✅ Created category: ${PRODUCT.initial.category}`);
  const categorySuccessLocator = page.locator('div[role="alert"].toast-body:has-text("Category has been added successfully!")');
  await expect(categorySuccessLocator).toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster appeared: "Category has been added successfully!"');
  await expect(categorySuccessLocator).not.toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster disappeared. Proceeding to product details...');
  await page.locator('div').filter({ hasText: /^Multiple$/ }).nth(1).click();
  for (const variant of PRODUCT.initial.variants) {
    await page.getByRole('textbox', { name: 'e.g. Red, Green, Blue' }).fill(variant.name);
    await page.getByRole('textbox', { name: 'e.g. Red, Green, Blue' }).press('Enter');
  }
  await page.getByRole('button', { name: 'ADD' }).click();
  for (const variant of PRODUCT.initial.variants) {
    await page.getByRole('cell', { name: variant.name }).click();
    await page.getByRole('textbox', { name: 'Variant Code', exact: true }).fill(variant.code);
    await page.getByRole('textbox', { name: 'Cost', exact: true   }).fill('');
    await page.getByRole('textbox', { name: 'Cost', exact: true  }).type(variant.cost, { delay: 50 });
    await page.getByRole('textbox', { name: 'Cost' }).press('Tab');
    await page.getByRole('textbox', { name: 'Price', exact: true  }).fill('');
    await page.getByRole('textbox', { name: 'Price', exact: true  }).type(variant.price, { delay: 50 });
    await page.getByRole('button', { name: 'Ok (F2)' }).click();
  }
  await page.getByRole('button', { name: 'Save' }).click();
  const toaster = await page.waitForSelector('div[role="alert"].toast-body');
  const message = await toaster.textContent();
  expect(message).toContain('Product has been submitted successfully');
  console.log('✅ Product creation toaster detected.'); // Log: Product creation success notification detected
});


test('Validate Product Info List - via UI', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  const tableRow = page.locator('#tableGrid > tbody > tr').first();
  await expect(tableRow).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(2)')).toContainText(PRODUCT.initial.name);
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(3)')).toContainText(PRODUCT.initial.code);
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(4)')).toContainText(PRODUCT.initial.category);
  const variantCell = page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(5)');
  for (const variant of PRODUCT.initial.variants) {
    await expect(variantCell).toContainText(variant.name);
    await expect(variantCell).toContainText(variant.code);
  }
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(6)')).toContainText('100,000 - 200,000');
  const expectedDate = getTodayShortDate();
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(7)')).toContainText(expectedDate);
});
test('Validate Product Info Detail - via UI', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('link', { name: PRODUCT.initial.name }).click();
  const codeField = page.locator('pos-info-page-input[labelvalue="Code"]');
  const categoryField = page.locator('pos-info-page-input[labelvalue="Category"]');
  const releasedateField = page.locator('pos-info-page-input[labelvalue="Release Date"]');
  expect(await codeField.innerText()).toContain(PRODUCT.initial.code);
  expect(await categoryField.innerText()).toContain(PRODUCT.initial.category);
  expect(await releasedateField.innerText()).toContain(getTodayLongDate());
  const variantRows = page.locator('table.table-bordered > tbody > tr');
  for (let i = 0; i < PRODUCT.initial.variants.length; i++) {
    const row = variantRows.nth(i);
    await expect(row.locator('td').nth(0)).toContainText(PRODUCT.initial.variants[i].name);
    await expect(row.locator('td').nth(1)).toContainText(PRODUCT.initial.variants[i].code);
    await expect(row.locator('td').nth(3)).toContainText(PRODUCT.initial.variants[i].cost);
    await expect(row.locator('td').nth(4)).toContainText(PRODUCT.initial.variants[i].price);
  }
  console.log('✅ Product detail verification successful.'); // Log: Product detail verification successful
});

// Test 6: Update Product - via UI
test('Update Product - via UI', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('link', { name: 'Kaos Polos' }).click();
  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill(PRODUCT.update.name);
  await page.getByRole('textbox', { name: 'Code' }).fill(PRODUCT.update.code);
  await page.locator('#btnCategory').click();
  const dialog = page.locator('.modal-body');
  await dialog.getByRole('textbox', { name: 'Name' }).fill(PRODUCT.update.category);
  await page.getByRole('button', { name: 'Ok (F2)' }).click();
  console.log(`✅ Created category: ${PRODUCT.update.category}`);
  const categorySuccessLocator = page.locator('div[role="alert"].toast-body:has-text("Category has been added successfully!")');
  await expect(categorySuccessLocator).toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster appeared: "Category has been added successfully!"');
  await expect(categorySuccessLocator).not.toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster disappeared. Proceeding to product details...');
  for (const [i, variant] of PRODUCT.update.variants.entries()) {
    await page.getByText(['Small', 'Medium', 'Large'][i]).click();
    await page.getByRole('textbox', { name: 'Variant Name' }).fill(variant.name);
    await page.getByRole('textbox', { name: 'Variant Code', exact: true }).fill(variant.code);
    await page.getByRole('textbox', { name: 'Cost', exact: true  }).fill('');
    await page.getByRole('textbox', { name: 'Cost', exact: true }).type(variant.cost, { delay: 50 });
    await page.getByRole('textbox', { name: 'Price', exact: true }).fill('');
    await page.getByRole('textbox', { name: 'Price', exact: true }).type(variant.price, { delay: 50 });
    await page.getByRole('button', { name: 'Ok (F2)' }).click();
  }
  await page.getByRole('button', { name: 'Save' }).click();
  const productToaster = await page.waitForSelector('div[role="alert"].toast-body', {
    timeout: 10000,
    state: 'visible'
  });
  console.log('✅ Product update toaster appeared');
  const message = await productToaster.textContent();
  console.log('Toast message:', message);
  expect(message).toMatch(/Product.*success|success.*Product/i);
  console.log('✅ Test completed: Product updated successfully!');
});

// Test 8: Validate Product Info List after Update - via UI
test('Validate Product Info List after update - via UI', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  const tableRow = page.locator('#tableGrid > tbody > tr').first();
  await expect(tableRow).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(2)')).toContainText(PRODUCT.update.name);
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(3)')).toContainText(PRODUCT.update.code);
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(4)')).toContainText(PRODUCT.update.category);
  const variantCell = page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(5)');
  for (const variant of PRODUCT.update.variants) {
    await expect(variantCell).toContainText(variant.name);
    await expect(variantCell).toContainText(variant.code);
  }
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(6)')).toContainText('150,000 - 250,000');
  const expectedDate = getTodayShortDate();
  await expect(page.locator('#tableGrid > tbody > tr:nth-child(1) > td:nth-child(7)')).toContainText(expectedDate);
});

// Test 9: Validate Product Info Detail after Update - via UI
test('Validate Product Info Detail after Updated - via UI', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('link', { name: PRODUCT.update.name }).click();
  const codeField = page.locator('pos-info-page-input[labelvalue="Code"]');
  const categoryField = page.locator('pos-info-page-input[labelvalue="Category"]');
  const releasedateField = page.locator('pos-info-page-input[labelvalue="Release Date"]');
  expect(await codeField.innerText()).toContain(PRODUCT.update.code);
  expect(await categoryField.innerText()).toContain(PRODUCT.update.category);
  expect(await releasedateField.innerText()).toContain(getTodayLongDate());
  const variantRows = page.locator('table.table-bordered > tbody > tr');
  for (let i = 0; i < PRODUCT.update.variants.length; i++) {
    const row = variantRows.nth(i);
    await expect(row.locator('td').nth(0)).toContainText(PRODUCT.update.variants[i].name);
    await expect(row.locator('td').nth(1)).toContainText(PRODUCT.update.variants[i].code);
    await expect(row.locator('td').nth(3)).toContainText(PRODUCT.update.variants[i].cost);
    await expect(row.locator('td').nth(4)).toContainText(PRODUCT.update.variants[i].price);
  }
  console.log('✅ Updated product detail verification successful.'); // Log: Updated product detail verification successful
});

// Test 10: Delete the Product
test('Delete the Product', async ({ page }) => {
  // 1. Set up Dialog Handler
  page.once('dialog', async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept(); // Confirms deletion
  });

  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');

  // Define the locator for the product row based on the name we updated in Test 5
  const productRowLocator = page.locator('tr', { hasText: PRODUCT.update.name });

  // 2. Target the specific product's checkbox and click delete
  await productRowLocator.getByRole('checkbox').check();
  await page.getByText('Delete').click();

  // 3. Validation 1: Wait for and check the success message (replaces waitForTimeout)
  const productToaster = await page.waitForSelector('div[role="alert"].toast-body', {
    timeout: 10000,
    state: 'visible'
  });
  console.log('✅ Product delete toaster appeared');
  const message = await productToaster.textContent();
  console.log('Toast message:', message);
  expect(message).toMatch(/Record.*success|success.*Record/i);
  console.log('✅ Test completed: Product deleted successfully!');

  await expect(productRowLocator).not.toBeVisible();
  console.log(`✅ Final Validation: Product: ${PRODUCT.update.name} is no longer visible in the list.`);
});

// Test 11: Delete the Category
test('Delete the Category', async ({ page }) => {
  // Use page.on for a reusable dialog handler across multiple delete actions
  page.on('dialog', async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Categories');

  const updatedCategoryLocator = page.getByRole('treeitem', { name: PRODUCT.update.category });
  const originalCategoryLocator = page.getByRole('treeitem', { name: PRODUCT.initial.category });

  // --- Deletion 1: Updated Category ---
  await updatedCategoryLocator.locator('div').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete' }).click(); // Better locator

  // 1a. Wait for success toaster (for the first delete)
  await expect(page.locator('div[role="alert"].toast-body')).toContainText(/success|deleted/i);
  console.log(`✅ Toaster validated for deletion of: ${PRODUCT.update.category}`);
  await page.reload();

  // 1b. Validation 1: Check that the updated category is gone
  await expect(updatedCategoryLocator).not.toBeVisible();
  console.log(`✅ Final Validation: ${PRODUCT.update.category} is no longer visible.`);

  // --- Deletion 2: Original Category ---
  await originalCategoryLocator.locator('div').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete' }).click();

  // 2a. Wait for success toaster (for the second delete)
  await expect(page.locator('div[role="alert"].toast-body')).toContainText(/success|deleted/i);
  console.log(`✅ Toaster validated for deletion of: ${PRODUCT.initial.category}`);
  await page.reload();

  // 2b. Validation 2: Check that the original category is gone
  await expect(originalCategoryLocator).not.toBeVisible();
  console.log(`✅ Final Validation: ${PRODUCT.initial.category} is no longer visible.`);
});

// Test 12: Validate if Product List is Empty
test('Validate if Product List is Empty after delete', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.waitForSelector('#tableGrid', { timeout: 10000 });
  const rowCount = await page.locator('#tableGrid > tbody > tr').count();
  expect(rowCount).toBe(0);
  console.log('✅ Product table is empty.'); // Log: Product table is empty
});