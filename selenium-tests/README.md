# Green Harvest Buddy — Selenium Web Node.js Test Suite

This directory contains a complete, robust, and automated End-to-End (E2E) web test suite for the **Green Harvest Buddy** application using **Node.js**, **Selenium WebDriver**, and **exceljs**.

It is designed to automate visual alignment, authentication flows, weather/mandi widget rendering, multilingual chatbot queries, crop disease diagnoses, and profile settings adjustments in web browsers (Chrome), generating **formatted Excel report sheets and screenshot records** for analysis.

---

## 🛠️ Prerequisites & Setup

To run these tests on your local machine, you must have Node.js and Google Chrome installed.

### 1. Node.js Environment Setup
* Ensure **Node.js (v18+)** and `npm` are installed.
* Navigate to the test directory (`selenium-tests`) and install dependencies:
  ```bash
  cd selenium-tests
  npm install
  ```

### 2. Browser & Driver Setup
* Make sure **Google Chrome** is installed on your system.
* ChromeDriver is handled automatically by modern Selenium WebDriver versions, so no separate chromedriver installation or path configuration is needed.

### 3. Application Web Server
* Ensure the target web application (e.g., the React/TanStack Start app) is running locally or deployed.
* If running locally from the `green-harvest-buddy-main` directory:
  ```bash
  npm run dev
  ```

---

## 🚀 Running the Tests

You can run the tests in either headless mode (for CI/CD pipeline compatibility) or headed mode (to watch the browser interact).

### 1. Execute in Headless Mode (Default)
Run the default test runner from the `selenium-tests` folder:
```bash
npm test
```

### 2. Execute in Headed Mode
To watch the browser window execute the steps:
```bash
npm run test:headed
```

---

## 📊 Environment Configuration (`.env` or `config.js`)

You can customize test endpoints and timing parameters inside `config.js` or by setting environment variables:

* **`TARGET_URL`**: The web application URL (default: `http://localhost:3000`)
* **`HEADLESS`**: Toggle headless browser execution (default: `true`)
* **`TIMEOUTS`**: Explicit element polling wait timeouts

---

## 📁 Test Reports & Execution Logs

Upon completing a test run, the suite compiles all execution details and outputs them to:
```filepath
selenium-tests/reports/
```

Inside this directory, you will find:
1. **Excel Analysis Workbook** (`GreenHarvestBuddy_Selenium_E2E_<timestamp>.xlsx`):
   * **Dashboard Summary Sheet**: Professional green-themed dashboard tracking KPIs (Total Steps, Passed, Failed, Pass Rate, Deployability Index).
   * **Detailed Category Sheets**: 4 separate sheets (UI-UX Tests, Functional Tests, Unit Tests, Validation Tests) logging element targets, actions, expected vs actual results, execution timings, and conditional status highlights (`PASS` / `FAIL`).
2. **Screenshots Directory** (`selenium-tests/reports/screenshots/`):
   * Detailed viewport screenshots captured at each verification step.
