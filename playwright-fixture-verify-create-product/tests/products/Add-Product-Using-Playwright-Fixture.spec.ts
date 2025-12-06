import { test, expect } from "../base";

//Function to get today's date in the format "DD MMM YY"
function getTodayShortDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleString('en-US', { month: 'short' }); // e.g. Jul
  const year = String(now.getFullYear()).slice(-2); // Ambil 2 digit terakhir
  return `${day} ${month} ${year}`;
}

// Awal mulai test
test('Create New Product', async ({loggedInPage}) => {
  headless: false
  test.setTimeout(60000);

  // 1. Buka halaman Products
  await loggedInPage.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');

  await loggedInPage.getByRole('button', { name: 'Add' }).click();
  await loggedInPage.getByRole('textbox', { name: 'Name' }).click();
  await loggedInPage.getByRole('textbox', { name: 'Name' }).fill('Kaos Casual');

  await loggedInPage.getByRole('textbox', { name: 'Code' }).click();
  await loggedInPage.getByRole('textbox', { name: 'Code' }).fill('KPS');

  await loggedInPage.locator('#btnCategory').click();
  const dialog = loggedInPage.locator('.modal-body');
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Kaos Polos');
  await loggedInPage.getByRole('button', { name: 'Ok (F2)' }).click();
  console.log(`✅ Created category: Kaos Polos`);
  const categorySuccessLocator = loggedInPage.locator('div[role="alert"].toast-body:has-text("Category has been added successfully!")');
  await expect(categorySuccessLocator).toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster appeared: "Category has been added successfully!"');
  await expect(categorySuccessLocator).not.toBeVisible({ timeout: 10000 });
  console.log('✅ Category toaster disappeared. Proceeding to product details...');

  // Fill buying cost - simplified approach
  await loggedInPage.getByRole('textbox', { name: 'Cost' }).click();
  await loggedInPage.getByRole('textbox', { name: 'Cost' }).fill('');
  await loggedInPage.getByRole('textbox', { name: 'Cost' }).type('50000');
  await loggedInPage.getByRole('textbox', { name: 'Price' }).click();
  await loggedInPage.getByRole('textbox', { name: 'Price' }).fill('');
  await loggedInPage.getByRole('textbox', { name: 'Price' }).type('100000');

  await loggedInPage.getByRole('button', { name: 'Save' }).click();

  const productToaster = await loggedInPage.waitForSelector('div[role="alert"].toast-body', {
    timeout: 10000,
    state: 'visible'
  });
  console.log('✅ Product update toaster appeared');
  const message = await productToaster.textContent();
  console.log('Toast message:', message);
  expect(message).toMatch(/Product.*success|success.*Product/i);
  console.log('✅ Test 2 completed: Product updated successfully!');

});

test('Open Product List and Validate List - via UI', async ({loggedInPage}) => {
  test.setTimeout(60000);

  await loggedInPage.goto('https://playwright.dealpos.net/menu/Products/Catalog/Products');
  const tableRow = loggedInPage.locator('#tableGrid > tbody > tr').first();
  await expect(tableRow).toBeVisible({ timeout: 5000 });

  // Validasi nama produk
  const expectedTags = [
    {
      name: 'Kaos Casual',
      code: 'KPS',
      category: 'Kaos Polos',
      price: '100,000',
    }
  ];

  // Validasi setiap value berdasarkan kolomnya
  for (let i = 0; i < expectedTags.length; i++) {
    const today = getTodayShortDate();
    const row = loggedInPage.locator(`#tableGrid > tbody > tr:nth-child(${i + 1})`);
    await expect(row.locator('td:nth-child(2)')).toContainText(expectedTags[i].name);
    await expect(row.locator('td:nth-child(3)')).toContainText(expectedTags[i].code);
    await expect(row.locator('td:nth-child(4)')).toContainText(expectedTags[i].category);
    await expect(row.locator('td:nth-child(6)')).toContainText(expectedTags[i].price);
    await expect(row.locator('td:nth-child(7)')).toContainText(today);
  }
});


test('Format Product via API', async ({ clearProductsAfter }) => {
  console.log("Product formatted successfully via API.");
});