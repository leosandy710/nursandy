import { test, Page, expect } from '@playwright/test';
import { request } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { tokenUtil } from '../../tests/util';

let page: Page;
let token = ''

test.beforeAll(async ({ browser, request }) => {
  page = await browser.newPage();
  const tokenLocalStorage = tokenUtil(await request.storageState())
  token = tokenLocalStorage
});

//Load config env variablenya
require('dotenv').config();
dotenv.config({ path: path.resolve(__dirname, 'sell', '.env') });
const API_TOKEN = process.env.BEARER;

test('Create Category', async () => {
  const createcategory = await request.newContext({
    baseURL: 'https://tokoferdi2.dealpos.net',
  });

  await createcategory.post('/api/v3/Category', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: {
      "Name": "Top/Me222n"
    }
  });

  expect(createcategory).toBeTruthy();
});

test('Delete Category', async () => {
  const deletecategory = await request.newContext({
    baseURL: 'https://tokoferdi2.dealpos.net',
  });

  await deletecategory.delete('/api/v3/Category', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: {
      "Name": "Top/Me222n"
    }
  });

  expect(deletecategory).toBeTruthy();
});
