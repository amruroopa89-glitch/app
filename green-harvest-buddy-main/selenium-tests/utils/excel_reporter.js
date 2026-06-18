import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

export const generateExcelReport = async (summary, steps, outputPath) => {
  const dirName = path.dirname(outputPath);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  
  // Categorize steps
  const uiSteps = steps.filter(s => s.id.startsWith('TC-UI'));
  const funcSteps = steps.filter(s => s.id.startsWith('TC-FUNC'));
  const unitSteps = steps.filter(s => s.id.startsWith('TC-UNIT'));
  const valSteps = steps.filter(s => s.id.startsWith('TC-VAL'));

  const categories = [
    { name: 'UI-UX Testing', key: 'ui', steps: uiSteps },
    { name: 'Functional Testing', key: 'func', steps: funcSteps },
    { name: 'Unit Testing', key: 'unit', steps: unitSteps },
    { name: 'Validation Testing', key: 'val', steps: valSteps }
  ];

  // -------------------------------------------------------------
  // Sheet 1: DASHBOARD SUMMARY
  // -------------------------------------------------------------
  const wsSummary = workbook.addWorksheet('Dashboard Summary');
  wsSummary.views = [{ showGridLines: true }];

  const fontFamily = 'Arial';
  const titleFont = { name: fontFamily, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  const sectionFont = { name: fontFamily, size: 12, bold: true, color: { argb: 'FF1B5E20' } };
  const boldFont = { name: fontFamily, size: 10, bold: true };
  const normalFont = { name: fontFamily, size: 10 };
  const noteFont = { name: fontFamily, size: 9, italic: true, color: { argb: 'FF555555' } };

  const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
  const lightGreenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
  const lightGreyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECEFF1' } };

  const greenBorderSide = { style: 'thin', color: { argb: 'FFA5D6A7' } };
  const greenBorder = { top: greenBorderSide, left: greenBorderSide, bottom: greenBorderSide, right: greenBorderSide };

  const greyBorderSide = { style: 'thin', color: { argb: 'FFCFD8DC' } };
  const greyBorder = { top: greyBorderSide, left: greyBorderSide, bottom: greyBorderSide, right: greyBorderSide };

  const thinBorderSide = { style: 'thin', color: { argb: 'FFE0E0E0' } };
  const thinBorder = { top: thinBorderSide, left: thinBorderSide, bottom: thinBorderSide, right: thinBorderSide };

  // Set Row Heights
  wsSummary.getRow(2).height = 40;
  
  // Title Banner
  wsSummary.mergeCells('A2:H2');
  const titleCell = wsSummary.getCell('A2');
  titleCell.value = 'GREEN HARVEST BUDDY - INTEGRATED QA & E2E TEST REPORT';
  titleCell.font = titleFont;
  titleCell.fill = greenFill;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Section 1: Execution Metadata
  wsSummary.getCell('A4').value = 'Execution Metadata';
  wsSummary.getCell('A4').font = sectionFont;

  const startDt = new Date(summary.startTime).toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const durationSec = ((summary.endTime - summary.startTime) / 1000).toFixed(2);

  const metaRows = [
    ['Execution Date', startDt],
    ['Platform Name', summary.platformName || 'Web Browser'],
    ['Device Name', summary.deviceName || 'Desktop Client'],
    ['Tested Browser', summary.browserName || 'Chrome'],
    ['Target URL', summary.targetUrl || ''],
    ['Execution Mode', 'Headless Regression'],
    ['Duration', `${durationSec} seconds`]
  ];

  metaRows.forEach((row, idx) => {
    const rNum = 5 + idx;
    const labelCell = wsSummary.getCell(`A${rNum}`);
    const valCell = wsSummary.getCell(`B${rNum}`);

    labelCell.value = row[0];
    labelCell.font = boldFont;
    labelCell.fill = lightGreenFill;
    labelCell.border = greenBorder;

    valCell.value = row[1];
    valCell.font = normalFont;
    valCell.border = greenBorder;
  });

  // Section 2: Deployable Status Summary Table
  wsSummary.getCell('D4').value = 'Deployable Status Summary';
  wsSummary.getCell('D4').font = sectionFont;

  const statusHeaders = ['Test Category', 'Test Cases', 'Passed', 'Failed', 'Status', 'Deployable Status'];
  statusHeaders.forEach((th, idx) => {
    const cell = wsSummary.getCell(5, idx + 4);
    cell.value = th;
    cell.font = boldFont;
    cell.fill = lightGreyFill;
    cell.border = greyBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let totalCases = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  categories.forEach((cat, idx) => {
    const rNum = 6 + idx;
    const count = cat.steps.length;
    const passed = cat.steps.filter(s => s.status === 'PASS').length;
    const failed = count - passed;
    const statusVal = failed === 0 && count > 0 ? 'PASS' : 'FAIL';
    const deployVal = failed === 0 && count > 0 ? 'DEPLOYABLE' : 'BLOCKED';

    totalCases += count;
    totalPassed += passed;
    totalFailed += failed;

    const rowCells = [
      wsSummary.getCell(`D${rNum}`),
      wsSummary.getCell(`E${rNum}`),
      wsSummary.getCell(`F${rNum}`),
      wsSummary.getCell(`G${rNum}`),
      wsSummary.getCell(`H${rNum}`),
      wsSummary.getCell(`I${rNum}`)
    ];

    rowCells[0].value = cat.name;
    rowCells[0].font = boldFont;
    
    rowCells[1].value = count;
    rowCells[2].value = passed;
    rowCells[3].value = failed;
    rowCells[4].value = statusVal;
    rowCells[5].value = deployVal;

    rowCells.forEach(cell => {
      cell.border = thinBorder;
      cell.font = normalFont;
    });

    // Formatting counts
    rowCells[1].alignment = { horizontal: 'center' };
    rowCells[2].alignment = { horizontal: 'center' };
    rowCells[3].alignment = { horizontal: 'center' };
    
    // Status
    rowCells[4].alignment = { horizontal: 'center' };
    if (statusVal === 'PASS') {
      rowCells[4].fill = lightGreenFill;
      rowCells[4].font = { name: fontFamily, size: 10, bold: true, color: { argb: 'FF2E7D32' } };
    } else {
      rowCells[4].fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      rowCells[4].font = { name: fontFamily, size: 10, bold: true, color: { argb: 'FFC62828' } };
    }

    // Deployable Status
    rowCells[5].alignment = { horizontal: 'center' };
    if (deployVal === 'DEPLOYABLE') {
      rowCells[5].fill = lightGreenFill;
      rowCells[5].font = { name: fontFamily, size: 10, bold: true, color: { argb: 'FF2E7D32' } };
    } else {
      rowCells[5].fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      rowCells[5].font = { name: fontFamily, size: 10, bold: true, color: { argb: 'FFC62828' } };
    }
  });

  // Total Summary Row
  const totalRowIndex = 6 + categories.length;
  const tRowCells = [
    wsSummary.getCell(`D${totalRowIndex}`),
    wsSummary.getCell(`E${totalRowIndex}`),
    wsSummary.getCell(`F${totalRowIndex}`),
    wsSummary.getCell(`G${totalRowIndex}`),
    wsSummary.getCell(`H${totalRowIndex}`),
    wsSummary.getCell(`I${totalRowIndex}`)
  ];

  tRowCells[0].value = 'OVERALL SUMMARY';
  tRowCells[0].font = boldFont;
  tRowCells[1].value = totalCases;
  tRowCells[2].value = totalPassed;
  tRowCells[3].value = totalFailed;
  tRowCells[4].value = totalFailed === 0 && totalCases > 0 ? 'PASS' : 'FAIL';
  tRowCells[5].value = totalFailed === 0 && totalCases > 0 ? 'DEPLOYABLE' : 'BLOCKED';

  tRowCells.forEach(cell => {
    cell.border = greyBorder;
    cell.font = boldFont;
    cell.fill = lightGreyFill;
  });

  tRowCells[1].alignment = { horizontal: 'center' };
  tRowCells[2].alignment = { horizontal: 'center' };
  tRowCells[3].alignment = { horizontal: 'center' };
  
  tRowCells[4].alignment = { horizontal: 'center' };
  tRowCells[4].font = { name: fontFamily, size: 10, bold: true, color: { argb: totalFailed === 0 ? 'FF2E7D32' : 'FFC62828' } };

  tRowCells[5].alignment = { horizontal: 'center' };
  tRowCells[5].font = { name: fontFamily, size: 10, bold: true, color: { argb: totalFailed === 0 ? 'FF2E7D32' : 'FFC62828' } };

  // Description note
  wsSummary.mergeCells('A13:I14');
  const noteCell = wsSummary.getCell('A13');
  noteCell.value = 'Note: This E2E and functionality report provides validation metrics and deployable status criteria. Refer to subsequent worksheet tabs (UI-UX Tests, Functional Tests, Unit Tests, Validation Tests) for individual test logs, screenshot captures, and validation parameters.';
  noteCell.font = noteFont;
  noteCell.alignment = { wrapText: true, vertical: 'top' };

  wsSummary.getColumn('A').width = 24;
  wsSummary.getColumn('B').width = 32;
  wsSummary.getColumn('C').width = 4;
  wsSummary.getColumn('D').width = 24;
  wsSummary.getColumn('E').width = 16;
  wsSummary.getColumn('F').width = 16;
  wsSummary.getColumn('G').width = 16;
  wsSummary.getColumn('H').width = 16;
  wsSummary.getColumn('I').width = 22;

  // -------------------------------------------------------------
  // Sheet 2 to 5: DETAIL TESTING LOG SHEETS
  // -------------------------------------------------------------
  const testSheets = [
    { title: 'UI-UX Tests', steps: uiSteps },
    { title: 'Functional Tests', steps: funcSteps },
    { title: 'Unit Tests', steps: unitSteps },
    { title: 'Validation Tests', steps: valSteps }
  ];

  const headers = [
    { header: 'ID', key: 'id', width: 14 },
    { header: 'Test Module / Feature', key: 'module', width: 22 },
    { header: 'Test Case Description', key: 'description', width: 38 },
    { header: 'Action Taken', key: 'action', width: 38 },
    { header: 'Expected Outcome', key: 'expected', width: 38 },
    { header: 'Actual Result / Output', key: 'actual', width: 48 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Duration (ms)', key: 'duration', width: 14 },
    { header: 'Timestamp', key: 'timestamp', width: 22 }
  ];

  testSheets.forEach(ts => {
    const ws = workbook.addWorksheet(ts.title);
    ws.views = [{ showGridLines: true }];
    ws.columns = headers;
    ws.getRow(1).height = 30;

    // Header styling
    headers.forEach((h, idx) => {
      const cell = ws.getCell(1, idx + 1);
      cell.font = { name: fontFamily, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = greenFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1B5E20' } },
        bottom: { style: 'medium', color: { argb: 'FF1B5E20' } }
      };
    });

    // Write steps
    ts.steps.forEach((step, idx) => {
      const rNum = idx + 2;
      ws.getRow(rNum).height = 24;

      const rowData = {
        id: step.id,
        module: step.module,
        description: step.description,
        action: step.action,
        expected: step.expected,
        actual: step.actual,
        status: step.status,
        duration: step.duration,
        timestamp: step.timestamp ? step.timestamp.substring(11, 19) : ''
      };

      const row = ws.addRow(rowData);

      // Styling standard columns
      row.getCell('id').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('module').alignment = { vertical: 'middle' };
      row.getCell('description').alignment = { vertical: 'middle', wrapText: true };
      row.getCell('action').alignment = { vertical: 'middle', wrapText: true };
      row.getCell('expected').alignment = { vertical: 'middle', wrapText: true };
      row.getCell('actual').alignment = { vertical: 'middle', wrapText: true };
      
      // Status color
      const statusCell = row.getCell('status');
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (step.status === 'PASS') {
        statusCell.fill = lightGreenFill;
        statusCell.font = { name: fontFamily, size: 10, bold: true, color: { argb: 'FF2E7D32' } };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
        statusCell.font = { name: fontFamily, size: 10, bold: true, color: { argb: 'FFC62828' } };
      }

      // Duration & Timestamp
      const durCell = row.getCell('duration');
      durCell.alignment = { horizontal: 'right', vertical: 'middle' };
      durCell.numFmt = '#,##0';

      // Apply thin borders
      for (let c = 1; c <= headers.length; c++) {
        row.getCell(c).border = thinBorder;
      }
    });
  });

  await workbook.xlsx.writeFile(outputPath);
  console.log(`[+] Multi-tab Excel report compiled successfully at: ${outputPath}`);
};
