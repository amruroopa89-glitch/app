/**
 * Green Harvest Buddy — Selenium E2E Web Test Runner (Modular version)
 * Imports split categories and executes them sequentially to compile a combined report.
 *
 * Usage: node tests/e2e_test.js
 */

import { runCategory, generateCombinedReport } from './test_runner.js';
import { runUITests } from './test_ui.js';
import { runFunctionalTests } from './test_functional.js';
import { runUnitTests } from './test_unit.js';
import { runValidationTests } from './test_validation.js';

async function runAll() {
  console.log('[+] Starting Green Harvest Buddy E2E Test Suite (Modular)...');
  
  const limit100 = process.env.LIMIT_100 === 'true';
  const allResults = [];

  if (limit100) {
    console.log('[+] LIMIT_100=true: Running exactly 100 cases (Unit/Component Tests only)...');
    const unitResult = await runCategory('Unit Tests', runUnitTests);
    allResults.push(unitResult);
  } else {
    const uiResult = await runCategory('UI-UX Tests', runUITests);
    const funcResult = await runCategory('Functional Tests', runFunctionalTests);
    const unitResult = await runCategory('Unit Tests', runUnitTests);
    const valResult = await runCategory('Validation Tests', runValidationTests);
    allResults.push(uiResult, funcResult, unitResult, valResult);
  }

  await generateCombinedReport(allResults);
  
  console.log('[✅] All E2E test categories completed successfully!');
}

runAll().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
