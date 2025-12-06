🎭 Playwright E2E Automation Framework
🚀 Overview
This repository hosts a robust End-to-End (E2E) automation framework built using Playwright and TypeScript. The goal of this framework is to provide reliable and fast regression testing for the [Your Application Name] web application across various browsers.

🌟 Key Features
- Fast & Reliable E2E Testing: Leveraging Playwright's modern architecture for speed and stability.

- Cross-Browser Support: Tests are configured to run on Chromium and Firefox

- Page Object Model (POM): Organized structure for maximum maintainability and reusability.

- Authentication State Persistence: Allows for saving a logged-in session state (cookies, local storage) after initial login and reusing it across subsequent tests to skip repetitive login steps, significantly boosting test speed.

🛠️ Prerequisites
Before running the tests, ensure you have the following installed:
- Node.js: Version 18+ (LTS recommended)
- npm: Comes bundled with Node.js
- Git

⚙️ Project Setup and Installation
1. Clone the Repository
git clone [YOUR-REPO-URL]
cd [your-repo-name]

2. Install Dependencies
Install all the necessary packages and Playwright browser drivers:
npm install
npx playwright install

▶️ Running Tests
Standard Test Execution
Use the following commands to run the full test suite:
| Command | Description
| npm run test | "Runs tests on Chromium (default), in headless mode."
| npm run test:ui | Opens the Playwright UI mode for debugging and interactive testing.
| npm run test:headed | Runs tests on all configured browsers in visible mode.
| npm run test:smoke | Runs tests tagged with @smoke only.

Running Specific Tests
To run tests by file path or tag:
# Run tests from a specific file
npx playwright test tests/2. Create New Product.spec.ts

# Run tests containing a specific title/tag
npx playwright test --grep "@critical"