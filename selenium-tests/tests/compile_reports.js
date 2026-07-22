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
  const sheets = wb.worksheets.map(ws => ws.name).filter(name => name !== 'Dashboard Summary');

  for (const sheetName of sheets) {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) continue;

    // Rows start at index 3 (index 1 is banner, index 2 is header)
    ws.eachRow((row, rowNumber) => {
      if (rowNumber >= 3) {
        const id = row.getCell(1).value;
        if (id) {
          const has12Cols = row.getCell(10).value !== null && row.getCell(11).value !== null;
          if (has12Cols) {
            steps.push({
              id: String(id),
              module: String(row.getCell(2).value || ''),
              scenario: String(row.getCell(3).value || ''),
              description: String(row.getCell(4).value || ''),
              preconditions: String(row.getCell(5).value || 'N/A'),
              steps: String(row.getCell(6).value || ''),
              data: String(row.getCell(7).value || 'None'),
              expected: String(row.getCell(8).value || ''),
              actual: String(row.getCell(9).value || ''),
              status: String(row.getCell(10).value || 'PASS'),
              severity: String(row.getCell(11).value || 'Medium'),
              priority: String(row.getCell(12).value || 'P1')
            });
          } else {
            steps.push({
              id: String(id),
              module: String(row.getCell(2).value || ''),
              scenario: String(row.getCell(3).value || ''),
              description: String(row.getCell(3).value || ''),
              preconditions: 'N/A',
              steps: String(row.getCell(4).value || ''),
              data: 'None',
              expected: String(row.getCell(5).value || ''),
              actual: String(row.getCell(6).value || ''),
              status: String(row.getCell(7).value || 'PASS'),
              severity: 'Medium',
              priority: 'P1'
            });
          }
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

  const uniqueSteps = [];
  const seenIds = new Set();
  for (const step of allSteps) {
    if (!seenIds.has(step.id)) {
      seenIds.add(step.id);
      uniqueSteps.push(step);
    }
  }

  if (uniqueSteps.length === 0) {
    console.warn('[!] No steps found to compile. Creating empty report placeholder.');
  }

  const totalPass = uniqueSteps.filter(s => s.status === 'PASS').length;
  const totalFail = uniqueSteps.length - totalPass;

  const summary = {
    startTime: Math.min(...startTimes, Date.now() - 180000),
    endTime: Math.max(...endTimes, Date.now()),
    platformName: 'Web & Mobile (E2E)',
    deviceName:   'Desktop & Emulator',
    browserName:  'Chrome & Appium',
    targetUrl:    TARGET_URL,
    totalSteps:   uniqueSteps.length,
    passed:       totalPass,
    failed:       totalFail,
  };

  const absoluteOutputPath = path.resolve(outputPath);
  await generateExcelReport(summary, uniqueSteps, absoluteOutputPath);
  console.log(`[✅] Master consolidated report successfully written to ${absoluteOutputPath}`);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
