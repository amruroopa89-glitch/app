# 🌾 Green Harvest Buddy

Welcome to the **Green Harvest Buddy** repository! This is a modern, responsive agricultural assistant designed to empower farmers with real-time agronomic insights, crop recommendation calculation engines, crop disease detection tools, and market prices (mandi index) - all packaged beautifully for both web browsers and mobile platforms.

---

## 🛠️ Tech Stack & Architecture

Green Harvest Buddy is built with premium developer tools to ensure fast rendering, modular growth, and cross-platform portability:

* **Frontend Framework**: [React 19](https://react.dev/) & [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (for seamless full-stack React application routing and Server Functions).
* **Styling**: [TailwindCSS (v4)](https://tailwindcss.com/) for high-fidelity custom design systems, modern glassmorphism UI elements, and fast responsive layouts.
* **Backend Database & Auth**: [Supabase](https://supabase.com/) for secure authentication, user profiles, and real-time database syncing.
* **Mobile Shell Wrapper**: [Capacitor CLI](https://capacitorjs.com/) to build, compile, and bundle native iOS & Android applications from the single codebase.

---

## 📂 Repository Structure

The project is organized cleanly to separate the core application from the extensive automated quality assurance pipelines:

```
├── .github/workflows/      # CI/CD pipelines (GitHub Actions)
├── android/                # Capacitor Android native build project
├── appium-tests/           # E2E mobile tests (Python & Appium)
│   ├── tests/              # Mobile verification test scripts
│   └── reports/            # Appium execution Excel logs & screenshots
├── mobile/                 # Mobile-specific web assets and layouts
├── selenium-tests/         # E2E web, unit, and performance tests (Node.js & Selenium)
│   ├── tests/              # Web E2E, load, and deployment scripts
│   ├── utils/              # Helper reporters and Excel generators
│   └── reports/            # Web execution Excel workbooks & screenshots
├── src/                    # Main application source code
│   ├── components/         # Reusable React components & UI design system
│   ├── routes/             # TanStack Start file-based routing
│   └── integrations/       # Database connections and API integrations
└── package.json            # Application dependencies and dev scripts
```

---

## 🚀 Getting Started

To run the application locally in development mode:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🧪 Quality Assurance & E2E Testing

This repository contains a world-class, automated E2E test suite running over **1,600 test cases** to ensure comprehensive coverage across both web and mobile experiences.

The test suite is divided into major sections:

### 1. Web E2E & Functional Testing (Selenium Node.js)
Located in `selenium-tests/`, this suite automates interactions in Google Chrome:
* **UI/UX Audits**: Verify layout alignment, responsive widths, and element coordinates.
* **Functional Scenarios**: Form submittals, authentication, chatbots, and crop calculations.
* **API Unit Tests**: Direct checks on service endpoints and validation rules.
* **Validation Tests**: Input limits, boundary conditions, and file uploads.
* **How to run locally**:
  ```bash
  cd selenium-tests
  npm install
  npm test
  ```
  *(For headed execution, run `npm run test:headed`)*

### 2. Mobile App Testing (Appium Python)
Located in `appium-tests/`, this suite runs tests against target mobile devices:
* Emulates touch gestures, keyboard entry, and layout audits on mobile screens.
* **How to run locally**:
  1. Start the Appium Server:
     ```bash
     appium
     ```
  2. Run the test script:
     ```bash
     cd appium-tests
     pip install -r requirements.txt
     python tests/e2e_test.py
     ```

### 3. Load & Performance Testing
* Simulates high user traffic and measures response times.
* **How to run locally**:
  ```bash
  cd selenium-tests
  node tests/run_load_test.js reports/load-test-report.xlsx
  ```

### 4. Deployment Status Testing
* Performs smoke tests on the application's build and runtime responsiveness.
* **How to run locally**:
  ```bash
  cd selenium-tests
  node tests/run_deployment_status.js reports/deployment-test-report.xlsx
  ```

---

## 📊 Consolidated Testing Reports & CI/CD Pipeline

When a commit is pushed to the repository, the **E2E Pipeline** (`e2e.yml`) triggers automatically in GitHub Actions, running:
1. **Selenium Web Tests** (400 cases)
2. **Appium Android Tests** (400 cases)
3. **Unit Tests** (400 cases)
4. **Validation Tests** (400 cases)
5. **Deployment Status Checks**
6. **Load & Performance Testing**

### Report Compilation
Once all concurrent testing jobs finish, the pipeline executes `compile_reports.js` to parse and merge the independent Excel spreadsheets into a single, beautiful master workbook: **`E2E_Test_Report_GreenHarvestBuddy_FINAL.xlsx`**. 

This sheet includes a professional green-themed **KPI Dashboard** calculating the total tests run, final pass rates, and the application's overall **Deployability Index**.

The master spreadsheet and dashboard are published directly to **GitHub Pages** after every successful run, allowing developers and stakeholders to download reports and inspect live quality metrics easily.
