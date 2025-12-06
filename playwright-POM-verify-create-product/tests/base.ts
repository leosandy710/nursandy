import { test as base, expect, APIRequestContext, Page } from '@playwright/test';
// NOTE: Ensure 'util' path is correct for tokenUtil
import { tokenUtil } from './util'; 
import * as fs from 'fs'; // Import File System module
import * as path from 'path'; // Import Path module

// Environment variables
const username = process.env.SYSTEM_USERNAME2 as string;
const password = process.env.SYSTEM_PASSWORD2 as string;

// Define the path to your saved authentication state file
// This should match the path used in playwright.config.ts and auth.setup.ts
const AUTH_FILE_PATH = path.resolve(process.cwd(), 'playwright', '.auth', 'user.json');

// Helper function (use 'string' for token type)
async function apiPostWithRetry(requestContext: APIRequestContext, url: string, data: any, token: string, retries = 3) {
    while (retries > 0) {
        // Ensure BASE_URL is set in your environment
        const baseUrl = process.env.BASE_URL || 'https://playwright.dealpos.net'; 
        const response = await requestContext.post(`${baseUrl}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, 
            },
            data: data,
        });

        if (response.status() === 429) {
            console.log(`Rate limit hit for ${url}, retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries--;
        } else {
            // Assert success; throw error if not 200 or 429
            expect(response.status(), `Failed API call to ${url}. Response status: ${response.status()}`).toBe(200);
            console.log(`Success: ${url}`);
            return;
        }
    }
    throw new Error(`API call to ${url} failed after all retries.`);
}

// ----------------------------------------------------------------------
// 1. Define Fixture Interfaces
// ----------------------------------------------------------------------

type AuthFixtures = {
    // Worker-scoped fixture to retrieve and hold the auth token
    authToken: string; 
    // Function-scoped fixture for authenticated page access
    loggedInPage: Page;
    // Teardown fixture to clear product data
    clearProductsAfter: void;
};

// ----------------------------------------------------------------------
// 2. Extend Base Test and Implement Fixtures
// ----------------------------------------------------------------------

export const test = base.extend<AuthFixtures>({
    
    // FIX 1: authToken fixture (Runs once per worker)
    // Removed 'request' dependency as it's not allowed in 'worker' scope for this purpose
    authToken: [async ({ }, use) => {
        console.log("Fixture Setup: Retrieving Authentication Token by reading state file...");

        if (!fs.existsSync(AUTH_FILE_PATH)) {
            throw new Error(`Authentication state file not found at: ${AUTH_FILE_PATH}. 
                Ensure your 'setup' project ran successfully to create this file.`);
        }

        // Read the storage state file directly
        const storageStateJson = fs.readFileSync(AUTH_FILE_PATH, 'utf-8');
        const storageState = JSON.parse(storageStateJson);

        // Calculate the token using your utility function
        const calculatedToken = tokenUtil(storageState);

        if (!calculatedToken) {
            throw new Error("Failed to retrieve authentication token via tokenUtil. Token not found in storage state.");
        }

        // Inject the token string (Crucial use() call)
        await use(calculatedToken);
    }, { scope: 'test' }], 

    // 2. loggedInPage Fixture
    loggedInPage: async ({ page }, use) => {
        if (!username || !password) {
            throw new Error("Missing credentials...");
        }
        
        console.log(`Starting login for user: ${username}`);
        
        try {
            await page.goto('https://playwright.dealpos.net/', { timeout: 15000, waitUntil: 'domcontentloaded' });
            await page.getByPlaceholder('Username').fill(username);
            await page.getByPlaceholder('Password').fill(password);
            await page.getByPlaceholder('Password').press('Enter');

            await page.waitForURL('https://playwright.dealpos.net/menu/Dashboard');
            await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
            
            console.log(`Login successful for user: ${username}`);
        } catch (error) {
            console.error('Authentication fixture failed during setup:', error);
            throw error;
        }
        
        await use(page);
    },

    // 3. clearProductsAfter Fixture (Teardown)
    clearProductsAfter: [async ({ request, authToken }, use) => { 
        // ➡️ SETUP: No action needed (runs before the test)
        await use(); 

        // ⬅️ TEARDOWN: Clear products (runs after the test)
        console.log("TEARDOWN: Clearing Products via API...");
        await apiPostWithRetry(request, '/api/Setup/Data/ClearProduct', {
            Subdomain: process.env.SYSTEM_USERNAME3,
            Password: process.env.SYSTEM_PASSWORD3
        }, authToken); // Use the injected 'authToken'
    }, { scope: 'test' }],
});

export { expect };