# Green Harvest Buddy — Appium Android Python Test Suite

This directory contains a complete, robust, and automated End-to-End (E2E) mobile test suite for the **Green Harvest Buddy** application using **Python**, the **Appium Python Client**, and **openpyxl**.

It is designed to automate interaction validation, user onboarding, crop recommendation calculations, multilingual chat inputs, disease detection layout audits, and user settings modification in a mobile browser (Chrome on Android) or native APK wrapper, generating **formatted Excel report sheets and screenshot records** for analysis.

---

## 🛠️ Prerequisites & Setup

To run these tests on your local machine, you must configure the Android development environment, the Appium Server, and Python.

### 1. Android Development Environment

- **Android Studio & SDK**: Make sure Android Studio is installed and SDK tools are configured.
- **Environment Variables**: Verify your Windows environment PATH variables contain:
  - `ANDROID_HOME` pointing to your SDK location (e.g. `C:\Users\<Username>\AppData\Local\Android\Sdk`)
  - `%ANDROID_HOME%\platform-tools` (which contains `adb.exe`)
  - `%ANDROID_HOME%\emulator`
- **Device**: Start an Android Emulator or connect a physical phone (with USB debugging enabled). Verify connection:
  ```bash
  adb devices
  ```

### 2. Node.js & Appium Server Setup

- Install the **Appium Server CLI** globally (requires Node.js v18+):
  ```bash
  npm install -g appium
  ```
- Install the **UiAutomator2 Driver** for Android:
  ```bash
  appium driver install uiautomator2
  ```

### 3. Python Environment Setup

- Ensure **Python 3.8+** is installed on your machine.
- Navigate to the test directory (`appium-tests`) and install dependencies:
  ```bash
  cd appium-tests
  pip install -r requirements.txt
  ```
  _(We recommend using a Python Virtual Environment like `python -m venv venv` and activating it before running `pip install`)._

---

## 🚀 Running the Tests

### 1. Start the Appium Server

In a separate terminal window, launch the Appium server:

```bash
appium
```

_(Keep this window open during execution)._

### 2. Start the Application Web Server

Ensure the target web application (e.g., the TanStack Start app) is running locally or deployed.
If running locally from the `green-harvest-buddy-main` directory:

```bash
npm run dev
```

### 3. Execute the E2E Python Test Suite

Run the test script from the `appium-tests` folder:

```bash
python tests/e2e_test.py
```

---

## 📊 Environment Configuration (`.env`)

You can customize the test parameters by creating a `.env` file in the `appium-tests/` directory:

```env
# Application Target URL (10.0.2.2 redirects to your host's localhost inside standard Emulator)
TEST_URL=http://10.0.2.2:3000

# Appium Connection Details
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723
APPIUM_PATH=/

# Android Customization
ANDROID_DEVICE_NAME=Android Emulator
BROWSER_NAME=Chrome
```

---

## 📁 Test Reports & Execution Logs

Upon completing a test run, the framework compiles all execution details and outputs them to:

```filepath
appium-tests/reports/
```

Inside this directory, you will find:

1. **Excel Analysis Workbook** (`Green_Harvest_Buddy_Appium_Report_<timestamp>.xlsx`):
   - **Dashboard Summary Sheet**: Overall metrics (Total Steps, Passed, Failed, Pass Rate) and platform metadata in a green-styled dashboard.
   - **Detailed Log Sheet**: Step-by-step audit showing target elements, actions taken, expected vs actual results, execution timings, and conditional status cells (`PASS` / `FAIL`).
2. **Screenshots Directory** (`appium-tests/reports/screenshots/`):
   - Viewport screenshots captured at each verification step.
