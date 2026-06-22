/**
 * Green Harvest Buddy — Custom Selenium Test Runner
 * Executes a list of categories (comma-separated) and generates an Excel report.
 * 
 * Usage: node tests/run_custom.js <categories> <output_path>
 * Example: node tests/run_custom.js ui,functional reports/selenium-web-report.xlsx
 */

import path from 'path';
import { runCategory } from './test_runner.js';
import { generateExcelReport } from '../utils/excel_reporter.js';
import { runUITests } from './test_ui.js';
import { runFunctionalTests } from './test_functional.js';
import { runUnitTests } from './test_unit.js';
import { runValidationTests } from './test_validation.js';
import { TARGET_URL } from '../config.js';

async function main() {
  const categoriesArg = process.argv[2];
  const outputPath = process.argv[3];

  if (!categoriesArg || !outputPath) {
    console.error('Usage: node tests/run_custom.js <categories> <output_path>');
    console.error('Example: node tests/run_custom.js ui,functional reports/selenium-web-report.xlsx');
    process.exit(1);
  }

  const categories = categoriesArg.split(',');
  const allResults = [];

  console.log(`[+] Custom Runner: categories=[${categories.join(', ')}] output=[${outputPath}]`);

  for (const cat of categories) {
    const trimmed = cat.trim().toLowerCase();
    if (trimmed === 'ui') {
      allResults.push(await runCategory('UI-UX Tests', runUITests));
    } else if (trimmed === 'functional') {
      allResults.push(await runCategory('Functional Tests', runFunctionalTests));
    } else if (trimmed === 'unit') {
      allResults.push(await runCategory('Unit Tests', runUnitTests));
    } else if (trimmed === 'validation') {
      allResults.push(await runCategory('Validation Tests', runValidationTests));
    } else {
      console.warn(`[!] Unknown category: ${cat}`);
    }
  }

  if (allResults.length === 0) {
    console.error('[❌] No categories matched.');
    process.exit(1);
  }

  const allSteps = allResults.flatMap(r => r.stepResults);
  const startTime = Math.min(...allResults.map(r => r.startTime));
  const endTime   = Math.max(...allResults.map(r => r.endTime));
  const totalPass = allSteps.filter(s => s.status === 'PASS').length;
  const totalFail = allSteps.filter(s => s.status !== 'PASS').length;

  const summary = {
    startTime, endTime,
    platformName: 'Web Browser',
    deviceName:   'Desktop Client',
    browserName:  'Google Chrome',
    targetUrl:    TARGET_URL,
    totalSteps:   allSteps.length,
    passed:       totalPass,
    failed:       totalFail,
  };

  const absoluteOutputPath = path.resolve(outputPath);
  await generateExcelReport(summary, allSteps, absoluteOutputPath);
  console.log(`[✅] Custom report written to ${absoluteOutputPath}`);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
