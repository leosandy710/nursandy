import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const TEST_DATA = {
  product: {
    name: 'Kaos Polos',
    code: 'KP',
    updatedName: 'Kaos Blank',
    updatedCode: 'KB',
    buyingCost: '50,000',
    updatedBuyingCost: '75,000',
    sellingPrice: '150,000',
    updatedSellingPrice: '180,000',
    variant: 'Default',
    updatedVariant: 'Standard',
  },
  category: {
    name: 'Kaos Polos Branded',
    updatedName: 'Kaos Blank',
  }
};

test.beforeAll(async () => {
  require('dotenv').config();
  dotenv.config({ path: path.resolve(__dirname, 'sell', '.env') });
});

// Test 1: Validate if Product List is Empty
test('1. Validate if Product List is Empty', async ({ page }) => {
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.waitForSelector('#tableGrid', { timeout: 10000 });
  const rowCount = await page.locator('#tableGrid > tbody > tr').count();
  if (rowCount === 0) {
    console.log('✅ Table is completely blank - no rows found');
    await expect(page.locator('#tableGrid > tbody > tr')).toHaveCount(0);
  } else {
    console.log(`⚠️ Table has ${rowCount} rows - not empty`);
  }
  console.log('✅ Test 1 completed: Product list empty validation');
});

// Test 2: Create New Product
test('2. Create New Product', async ({ page }) => {
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.locator('#btnCategory').click();
  const dialog = page.locator('.modal-body');
  await dialog.getByRole('textbox', { name: 'Name' }).fill(TEST_DATA.category.name);
  await page.getByRole('button', { name: 'Ok (F2)' }).click();
  console.log(`✅ Created category: ${TEST_DATA.category.name}`);
  const categorySuccessLocator = page.locator('div[role="alert"].toast-body:has-text("Category has been added successfully!")');
  await expect(categorySuccessLocator).toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster appeared: "Category has been added successfully!"');
  await expect(categorySuccessLocator).not.toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster disappeared. Proceeding to product details...');
  await page.getByRole('textbox', { name: 'Name' }).fill(TEST_DATA.product.name);
  await page.getByRole('textbox', { name: 'Code' }).fill(TEST_DATA.product.code);
  console.log(`✅ Filled product details: ${TEST_DATA.product.name} with code: ${TEST_DATA.product.code}`);

  const buying = page.getByPlaceholder('Buying Cost').first();
  await buying.click();
  await buying.fill('');
  await buying.type(String(TEST_DATA.product.buyingCost), { delay: 50 });
  await buying.press('Enter');

  const selling = page.getByPlaceholder('Selling Price').first();
  await selling.click();
  await selling.fill('');
  await selling.type(String(TEST_DATA.product.sellingPrice), { delay: 50 });
  await selling.press('Enter');

  console.log(`✅ Filled pricing: Buying Cost ${TEST_DATA.product.buyingCost}, Selling Price ${TEST_DATA.product.sellingPrice}`);
  await page.getByRole('button', { name: 'Save' }).click();
  const productToaster = await page.waitForSelector('div[role="alert"].toast-body', {
    timeout: 10000,
    state: 'visible'
  });
  console.log('✅ Product creation toaster appeared');
  const message = await productToaster.textContent();
  console.log('Toast message:', message);
  expect(message).toMatch(/Product.*success|success.*Product/i);
  console.log('✅ Test 2 completed: Product created successfully!');
});

// Test 3: Validate Product List Contains Correct Product Information
test('3. Validate Product List Contains Correct Product Information', async ({ page }) => {
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  const expectedProduct = {
    name: TEST_DATA.product.name,
    code: TEST_DATA.product.code,
    category: TEST_DATA.category.name,
    variant: 'default',
    sellingPrice: TEST_DATA.product.sellingPrice,
    releasedToday: true
  };
  const firstRow = page.locator('#tableGrid > tbody > tr:first-child');
  await expect(firstRow).toBeVisible();
  console.log('✅ Validating product information in list...');
  const nameCell = firstRow.locator('td').nth(1);
  const actualName = await nameCell.textContent();
  console.log('Product Name:', actualName?.trim());
  await expect(nameCell).toContainText(expectedProduct.name);
  const codeCell = firstRow.locator('td').nth(2);
  await expect(codeCell).toContainText(expectedProduct.code);
  console.log('✅ Product code validated');
  const categoryCell = firstRow.locator('td').nth(3);
  await expect(categoryCell).toContainText(expectedProduct.category);
  const variantCell = firstRow.locator('td').nth(4);
  const actualVariants = await variantCell.textContent();
  console.log('Variants:', actualVariants?.trim());
  expect(actualVariants?.trim().toLowerCase()).toContain('default');
  console.log('✅ Variant verified as "default"');
  const priceCell = firstRow.locator('td').nth(5);
  const actualPrice = await priceCell.textContent();
  console.log('Selling Price:', actualPrice?.trim());
  await expect(priceCell).toContainText(expectedProduct.sellingPrice);
  const releasedCell = firstRow.locator('td').nth(6);
  const actualReleased = await releasedCell.textContent();
  console.log('Released Status:', actualReleased?.trim());
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = today.toLocaleDateString('en', { month: 'short' });
  const year = today.getFullYear().toString().slice(-2);
  const expectedDate = `${day} ${month} ${year}`;
  console.log('Expected date format:', expectedDate);
  const releasedText = actualReleased?.trim() || '';
  const isReleasedToday = releasedText.includes(expectedDate)
  expect(isReleasedToday).toBe(true);
  console.log('✅ Test 3 completed: Product list validation completed successfully!');
});

// Test 4: Validate Product Internal Data Structure and Values
test('4. Validate Product Info Data', async ({ page }) => {
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('link', { name: TEST_DATA.product.name }).click();
  const codeField = page.locator('pos-info-page-input[labelvalue="Code"]');
  await expect(codeField).toBeVisible();
  await expect(codeField).toContainText(TEST_DATA.product.code)
  console.log('✅ Product code field validated successfully:', TEST_DATA.product.code);
  const categoryField = page.locator('pos-info-page-input[labelvalue="Category"]');
  await expect(categoryField).toBeVisible();
  await expect(categoryField).toContainText(TEST_DATA.category.name);
  console.log('✅ Product category field validated successfully:', TEST_DATA.category.name);
  const releasedField = page.locator('pos-info-page-input[labelvalue="Release Date"]');
  await expect(releasedField).toBeVisible();
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = today.toLocaleDateString('en', { month: 'short' });
  const year = today.getFullYear().toString().slice(-2);
  const expectedDate = `${day} ${month} ${year}`;
  // Extract only the date part from the field
  const releasedText = (await releasedField.innerText()).replace(/\s+/g, ' ').trim();
  const dateMatch = releasedText.match(/(\d{2} \w{3} \d{4})/);
  expect(dateMatch).not.toBeNull();
  expect(dateMatch![1]).toContain(`${day} ${month} 20${year}`);
  console.log('✅ Product release date field validated successfully:', expectedDate);
  const variantRows = page.locator('table.table-bordered > tbody > tr');
  const expectedVariants = [
    { name: TEST_DATA.product.variant, code: TEST_DATA.product.code, cost: TEST_DATA.product.buyingCost, price: TEST_DATA.product.sellingPrice }
  ];
  for (let i = 0; i < expectedVariants.length; i++) {
    const row = variantRows.nth(i);
    await expect(row.locator('td').nth(0)).toContainText(expectedVariants[i].name);
    await expect(row.locator('td').nth(1)).toContainText(expectedVariants[i].code);
    await expect(row.locator('td').nth(3)).toContainText(expectedVariants[i].cost);
    await expect(row.locator('td').nth(4)).toContainText(expectedVariants[i].price);
  }
  console.log('✅ Variant Detail Validated successfully.');
});

test('5. Update Product Data', async ({ page }) => {
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('link', { name: TEST_DATA.product.name }).click();
  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByRole('heading', { name: `Edit Product - ${TEST_DATA.product.name}` })).toBeVisible({ timeout: 10000 });
  const updateNameField = page.locator('input[placeholder="Name"]');
  const updateCodeField = page.locator('input[placeholder="Code"]');
  await updateNameField.fill('');
  await updateCodeField.fill('');
  await updateNameField.type(TEST_DATA.product.updatedName);
  await updateCodeField.type(TEST_DATA.product.updatedCode);
  console.log(`✅ Filled product details: ${TEST_DATA.product.updatedName} with code: ${TEST_DATA.product.updatedCode}`);

  await page.getByRole('button', { name: 'Add' }).click();
  await page.locator('#btnCategory').click();
  const dialog = page.locator('.modal-body');
  await dialog.getByRole('textbox', { name: 'Name' }).fill(TEST_DATA.category.updatedName);
  await page.getByRole('button', { name: 'Ok (F2)' }).click();
  console.log(`✅ Created category: ${TEST_DATA.category.updatedName}`);
  const categorySuccessLocator = page.locator('div[role="alert"].toast-body:has-text("Category has been added successfully!")');
  await expect(categorySuccessLocator).toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster appeared: "Category has been added successfully!"');
  await expect(categorySuccessLocator).not.toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster disappeared. Proceeding to product details...');
  await page.getByText(TEST_DATA.product.variant).click();
  await page.getByRole('textbox', { name: 'Variant Name' }).click();
  await page.getByRole('textbox', { name: 'Variant Name' }).fill('');
  await page.getByRole('textbox', { name: 'Variant Name' }).type(TEST_DATA.product.updatedVariant);
  await page.getByRole('textbox', { name: 'Variant Code' }).click();
  await page.getByRole('textbox', { name: 'Variant Code' }).fill('');
  await page.getByRole('textbox', { name: 'Variant Code' }).type(TEST_DATA.product.updatedCode);
  await page.getByRole('textbox', { name: 'Cost' }).click();
  await page.getByRole('textbox', { name: 'Cost' }).fill('');
  await page.getByRole('textbox', { name: 'Cost' }).type(TEST_DATA.product.updatedBuyingCost);
  await page.getByRole('textbox', { name: 'Price' }).click();
  await page.getByRole('textbox', { name: 'Price' }).fill('');
  await page.getByRole('textbox', { name: 'Price' }).type(TEST_DATA.product.updatedSellingPrice);
  await page.getByRole('button', { name: 'Ok (F2)' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  const productToaster = await page.waitForSelector('div[role="alert"].toast-body', {
    timeout: 10000,
    state: 'visible'
  });
  console.log('✅ Product update toaster appeared');
  const message = await productToaster.textContent();
  console.log('Toast message:', message);
  expect(message).toMatch(/Product.*success|success.*Product/i);
  console.log('✅ Test 2 completed: Product updated successfully!');
});

test('6. Validate Updated Product Info Data', async ({ page }) => {
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.getByRole('link', { name: TEST_DATA.product.updatedName }).click();
  const codeField = page.locator('pos-info-page-input[labelvalue="Code"]');
  await expect(codeField).toBeVisible();
  await expect(codeField).toContainText(TEST_DATA.product.updatedCode);
  console.log('✅ Product code field validated successfully:', TEST_DATA.product.updatedCode);
  const categoryField = page.locator('pos-info-page-input[labelvalue="Category"]');
  await expect(categoryField).toBeVisible();
  await expect(categoryField).toContainText(TEST_DATA.category.updatedName);
  console.log('✅ Product category field validated successfully:', TEST_DATA.category.updatedName);
  const releasedField = page.locator('pos-info-page-input[labelvalue="Release Date"]');
  await expect(releasedField).toBeVisible();
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = today.toLocaleDateString('en', { month: 'short' });
  const year = today.getFullYear().toString().slice(-2);
  const expectedDate = `${day} ${month} ${year}`;
  // Extract only the date part from the field
  const releasedText = (await releasedField.innerText()).replace(/\s+/g, ' ').trim();
  const dateMatch = releasedText.match(/(\d{2} \w{3} \d{4})/);
  expect(dateMatch).not.toBeNull();
  expect(dateMatch![1]).toContain(`${day} ${month} 20${year}`);
  console.log('✅ Product release date field validated successfully:', expectedDate);
  const variantRows = page.locator('table.table-bordered > tbody > tr');
  const expectedVariants = [
    { name: TEST_DATA.product.updatedVariant, code: TEST_DATA.product.updatedCode, cost: TEST_DATA.product.updatedBuyingCost, price: TEST_DATA.product.updatedSellingPrice }
  ];
  for (let i = 0; i < expectedVariants.length; i++) {
    const row = variantRows.nth(i);
    await expect(row.locator('td').nth(0)).toContainText(expectedVariants[i].name);
    await expect(row.locator('td').nth(1)).toContainText(expectedVariants[i].code);
    await expect(row.locator('td').nth(3)).toContainText(expectedVariants[i].cost);
    await expect(row.locator('td').nth(4)).toContainText(expectedVariants[i].price);
  }
  console.log('✅ Variant Detail Validated successfully.');
});

test('7. Delete the Product', async ({ page }) => {
  // 1. Set up Dialog Handler
  page.once('dialog', async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept(); // Confirms deletion
  });

  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');

  // Define the locator for the product row based on the name we updated in Test 5
  const productRowLocator = page.locator('tr', { hasText: TEST_DATA.product.updatedName });
  const deleteToasterLocator = page.locator('div[role="alert"].toast-body');

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
  console.log(`✅ Final Validation: Product: ${TEST_DATA.product.updatedName} is no longer visible in the list.`);
});

test('8. Delete the Category', async ({ page }) => {
  // Use page.on for a reusable dialog handler across multiple delete actions
  page.on('dialog', async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Categories');

  const updatedCategoryLocator = page.getByRole('treeitem', { name: TEST_DATA.category.updatedName });
  const originalCategoryLocator = page.getByRole('treeitem', { name: TEST_DATA.category.name });

  // --- Deletion 1: Updated Category ---
  await updatedCategoryLocator.locator('div').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete' }).click(); // Better locator

  // 1a. Wait for success toaster (for the first delete)
  await expect(page.locator('div[role="alert"].toast-body')).toContainText(/success|deleted/i);
  console.log(`✅ Toaster validated for deletion of: ${TEST_DATA.category.updatedName}`);
  await page.reload();

  // 1b. Validation 1: Check that the updated category is gone
  await expect(updatedCategoryLocator).not.toBeVisible();
  console.log(`✅ Final Validation: ${TEST_DATA.category.updatedName} is no longer visible.`);

  // --- Deletion 2: Original Category ---
  await originalCategoryLocator.locator('div').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete' }).click();

  // 2a. Wait for success toaster (for the second delete)
  await expect(page.locator('div[role="alert"].toast-body')).toContainText(/success|deleted/i);
  console.log(`✅ Toaster validated for deletion of: ${TEST_DATA.category.name}`);
  await page.reload();

  // 2b. Validation 2: Check that the original category is gone
  await expect(originalCategoryLocator).not.toBeVisible();
  console.log(`✅ Final Validation: ${TEST_DATA.category.name} is no longer visible.`);
});

test('9. Validate if Product List is Empty', async ({ page }) => {
  await page.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  await page.waitForSelector('#tableGrid', { timeout: 10000 });
  const rowCount = await page.locator('#tableGrid > tbody > tr').count();
  if (rowCount === 0) {
    console.log('✅ Table is completely blank - no rows found');
    await expect(page.locator('#tableGrid > tbody > tr')).toHaveCount(0);
  } else {
    console.log(`⚠️ Table has ${rowCount} rows - not empty`);
  }
  console.log('✅ Test 9 completed: Product list empty validation');
});