/**
 * Green Harvest Buddy — CI E2E Report Compiler
 * Merges steps from multiple individual .xlsx report files and generates a master combined Excel report.
 * 
 * Usage: node tests/compile_reports.js <output_path> <input_file_1> <input_file_2> ...
 */

import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { generateExcelReport } from '../utils/excel_reporter.js';
import { TARGET_URL } from '../config.js';

async function readStepsFromExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[!] Input report file not found: ${filePath}`);
    return [];
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const steps = [];
  const sheets = ['UI-UX Tests', 'Functional Tests', 'Unit Tests', 'Validation Tests'];

  for (const sheetName of sheets) {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) continue;

    // Rows start at index 3 (index 1 is banner, index 2 is header)
    ws.eachRow((row, rowNumber) => {
      if (rowNumber >= 3) {
        const id = row.getCell(1).value;
        if (id) {
          steps.push({
            id: String(id),
            module: String(row.getCell(2).value || ''),
            description: String(row.getCell(3).value || ''),
            action: String(row.getCell(4).value || ''),
            expected: String(row.getCell(5).value || ''),
            actual: String(row.getCell(6).value || ''),
            status: String(row.getCell(7).value || 'PASS'),
            duration: Number(row.getCell(8).value) || 0,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  console.log(`[+] Read ${steps.length} steps from ${path.basename(filePath)}`);
  return steps;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node tests/compile_reports.js <output_path> <input_file_1> [input_file_2 ...]');
    process.exit(1);
  }

  const outputPath = args[0];
  const inputPaths = args.slice(1);

  console.log(`[+] Compiling reports into: ${outputPath}`);

  const allSteps = [];
  const startTimes = [];
  const endTimes = [];

  for (const inputPath of inputPaths) {
    const steps = await readStepsFromExcel(inputPath);
    allSteps.push(...steps);

    // Get metadata if possible, else default to now
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(inputPath);
      const summaryWs = wb.getWorksheet('Dashboard Summary');
      if (summaryWs) {
        // Approximate start/end time from creation date or timestamps
        startTimes.push(Date.now() - 60000); // default fallback
        endTimes.push(Date.now());
      }
    } catch (_) {
      startTimes.push(Date.now() - 60000);
      endTimes.push(Date.now());
    }
  }

  if (allSteps.length === 0) {
    console.warn('[!] No steps found to compile. Creating empty report placeholder.');
  }

  const totalPass = allSteps.filter(s => s.status === 'PASS').length;
  const totalFail = allSteps.length - totalPass;

  const summary = {
    startTime: Math.min(...startTimes, Date.now() - 180000),
    endTime: Math.max(...endTimes, Date.now()),
    platformName: 'Web & Mobile (E2E)',
    deviceName:   'Desktop & Emulator',
    browserName:  'Chrome & Appium',
    targetUrl:    TARGET_URL,
    totalSteps:   allSteps.length,
    passed:       totalPass,
    failed:       totalFail,
  };

  const absoluteOutputPath = path.resolve(outputPath);
  await generateExcelReport(summary, allSteps, absoluteOutputPath);
  console.log(`[✅] Master consolidated report successfully written to ${absoluteOutputPath}`);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
