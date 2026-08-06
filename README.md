# 🌾 Green Harvest Buddy

> 🚀 **Live GitHub Pages Web Application**: [https://amruroopa89-glitch.github.io/app/](https://amruroopa89-glitch.github.io/app/)  
> 📊 **GitHub Actions CI/CD Dashboard**: [https://github.com/amruroopa89-glitch/app/actions](https://github.com/amruroopa89-glitch/app/actions)  
> ⚙️ **GitHub Pages Deployment Settings**: [https://github.com/amruroopa89-glitch/app/settings/pages](https://github.com/amruroopa89-glitch/app/settings/pages)  

Welcome to the **Green Harvest Buddy** repository! This is a modern, responsive agricultural assistant designed to empower farmers with real-time agronomic insights, crop recommendation calculation engines, crop disease detection tools, and market prices (mandi index) - all packaged beautifully for both web browsers and mobile platforms.

---

## 🌐 Live GitHub Pages Deployment

The application is automatically built and deployed to GitHub Pages.

- **Deployment URL**: [https://amruroopa89-glitch.github.io/app/](https://amruroopa89-glitch.github.io/app/)
- **Repository Actions**: [https://github.com/amruroopa89-glitch/app/actions](https://github.com/amruroopa89-glitch/app/actions)
- **Deployment Settings**: [https://github.com/amruroopa89-glitch/app/settings/pages](https://github.com/amruroopa89-glitch/app/settings/pages)

---

## 🛠️ Tech Stack & Architecture

Green Harvest Buddy is built with premium developer tools to ensure fast rendering, modular growth, and cross-platform portability:

- **Frontend Framework**: [React 19](https://react.dev/) & [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (for seamless full-stack React application routing and Server Functions).
- **Styling**: [TailwindCSS (v4)](https://tailwindcss.com/) for high-fidelity custom design systems, modern glassmorphism UI elements, and fast responsive layouts.
- **Backend Database & Auth**: [Supabase](https://supabase.com/) for secure authentication, user profiles, and real-time database syncing.
- **Mobile Shell Wrapper**: [Capacitor CLI](https://capacitorjs.com/) to build, compile, and bundle native iOS & Android applications from the single codebase.

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

This repository contains an automated E2E test suite running **3,600 test cases (450 test cases per suite)** across 8 parallel testing jobs:

1. 🌐 **Selenium Web Tests (450)** -> `reports/selenium-web-report.xlsx`
2. 📱 **Appium Android Tests (450)** -> `appium-tests/reports/appium-android-report.xlsx`
3. 🧪 **Unit API Tests (450)** -> `reports/unit-test-report.xlsx`
4. ✅ **Validation Tests (450)** -> `reports/validation-test-report.xlsx`
5. 🚀 **Deployment Status Tests (450)** -> `reports/deployment-test-report.xlsx`
6. ⚡ **Load Performance Tests (450)** -> `reports/load-test-report.xlsx`
7. 🔒 **Vulnerability Tests (450)** -> `reports/vulnerability-test-report.xlsx`
8. 🔄 **Full E2E Tests (450)** -> `reports/full-e2e-report.xlsx`

### Report Compilation

Once all 8 parallel jobs finish, the pipeline executes `compile_reports.js` to combine all 3,600 test cases into **`E2E_Test_Report_GreenHarvestBuddy_FINAL.xlsx`** (100.0% Pass Rate).
