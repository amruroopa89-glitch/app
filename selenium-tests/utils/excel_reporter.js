/**
 * Green Harvest Buddy — Selenium Excel Report Generator
 * Generates a professional multi-tab .xlsx with:
 *   Tab 1: Dashboard Summary  (KPIs, metadata, deployable status)
 *   Tab 2: UI/UX Tests
 *   Tab 3: Functional Tests
 *   Tab 4: Unit/Component Tests
 *   Tab 5: Validation Tests
 */

import fs   from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

// ── Colour / style constants ──────────────────────────────────────────────────
const C = {
  darkGreen : 'FF1B5E20',
  green     : 'FF2E7D32',
  lightGreen: 'FFE8F5E9',
  mintGreen : 'FFA5D6A7',
  grey      : 'FFECEFF1',
  greyBorder: 'FFCFD8DC',
  rowBorder : 'FFE0E0E0',
  white     : 'FFFFFFFF',
  red       : 'FFC62828',
  lightRed  : 'FFFFEBEE',
  amber     : 'FFFF8F00',
  lightAmber: 'FFFFF8E1',
  blue      : 'FF1565C0',
  text      : 'FF212121',
  subText   : 'FF555555',
};

const FONT  = 'Calibri';

// ── Helper: solid fill ────────────────────────────────────────────────────────
const fill  = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const border = (argb) => { const s = { style: 'thin', color: { argb } }; return { top:s, left:s, bottom:s, right:s }; };
const medBorder = (top,bot,argb='FF1B5E20') => ({
  top   : { style: 'medium', color: { argb } },
  bottom: { style: 'medium', color: { argb } },
});

// ── Style shortcuts ───────────────────────────────────────────────────────────
const font = (opts={}) => ({ name:FONT, size:10, ...opts });

// ─────────────────────────────────────────────────────────────────────────────
export const generateExcelReport = async (summary, steps, outputPath) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Green Harvest Buddy QA';
  wb.lastModifiedBy = 'Selenium E2E Suite';
  wb.created  = new Date();
  wb.modified = new Date();

  // ── Categorise steps ────────────────────────────────────────────────────────
  const groups = {
    ui  : steps.filter(s => s.id.startsWith('TC-UI')),
    func: steps.filter(s => s.id.startsWith('TC-FUNC')),
    unit: steps.filter(s => s.id.startsWith('TC-UNIT')),
    val : steps.filter(s => s.id.startsWith('TC-VAL')),
  };
  const cats = [
    { label:'UI / UX Testing',         key:'ui',   steps:groups.ui   },
    { label:'Functional Testing',       key:'func', steps:groups.func },
    { label:'Unit / Component Testing', key:'unit', steps:groups.unit },
    { label:'Validation Testing',       key:'val',  steps:groups.val  },
  ];

  // ── Runtime metrics ─────────────────────────────────────────────────────────
  const totalPass  = steps.filter(s => s.status==='PASS').length;
  const totalFail  = steps.length - totalPass;
  const passRate   = steps.length ? ((totalPass/steps.length)*100).toFixed(1) : '0.0';
  const durationMs = summary.endTime - summary.startTime;
  const durationS  = (durationMs/1000).toFixed(2);
  const startDt    = new Date(summary.startTime).toISOString().replace('T',' ').replace(/\..+/,'');

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 1 — DASHBOARD SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet('Dashboard Summary');
  ws.views = [{ showGridLines: true }];

  // ── Banner ─────────────────────────────────────────────────────────────────
  ws.getRow(2).height = 42;
  ws.mergeCells('A2:K2');
  const banner = ws.getCell('A2');
  banner.value     = '🌱  GREEN HARVEST BUDDY — SELENIUM WEB E2E TEST REPORT';
  banner.font      = font({ size:17, bold:true, color:{ argb:C.white } });
  banner.fill      = fill(C.green);
  banner.alignment = { horizontal:'center', vertical:'middle' };

  // ── Sub-banner ─────────────────────────────────────────────────────────────
  ws.getRow(3).height = 18;
  ws.mergeCells('A3:K3');
  const sub = ws.getCell('A3');
  sub.value     = `400 Test Cases  ·  UI/UX · Functional · Unit · Validation  ·  Generated ${startDt}`;
  sub.font      = font({ size:9, italic:true, color:{ argb:C.white } });
  sub.fill      = fill(C.darkGreen);
  sub.alignment = { horizontal:'center', vertical:'middle' };

  // ── Section header helper ─────────────────────────────────────────────────
  const secHeader = (cell, label) => {
    ws.getCell(cell).value = label;
    ws.getCell(cell).font  = font({ size:11, bold:true, color:{ argb:C.darkGreen } });
  };

  // ── SECTION A: Execution Metadata (rows 5-12) ────────────────────────────
  secHeader('A5', '📋  Execution Metadata');
  ws.getRow(5).height = 20;

  const meta = [
    ['Execution Date',      startDt],
    ['Platform',            summary.platformName || 'Web Browser'],
    ['Device',              summary.deviceName   || 'Desktop Client'],
    ['Browser',             summary.browserName  || 'Google Chrome'],
    ['Target URL',          summary.targetUrl    || 'http://localhost:8080'],
    ['Mode',                'Headless Regression (CI/CD)'],
    ['Total Duration',      `${durationS} seconds`],
  ];
  meta.forEach(([label, val], i) => {
    const r = 6 + i;
    const lCell = ws.getCell(r, 1);
    const vCell = ws.getCell(r, 2);
    lCell.value     = label;
    lCell.font      = font({ bold:true });
    lCell.fill      = fill(C.lightGreen);
    lCell.border    = border(C.mintGreen);
    lCell.alignment = { vertical:'middle' };
    vCell.value     = val;
    vCell.font      = font();
    vCell.border    = border(C.mintGreen);
    vCell.alignment = { vertical:'middle' };
    ws.getRow(r).height = 18;
  });

  // ── SECTION B: KPI Cards (rows 5-9, cols D-G) ─────────────────────────────
  secHeader('D5', '📊  Key Performance Indicators');
  const kpis = [
    { label:'Total Tests',  value:steps.length,    color: C.blue  },
    { label:'✅  Passed',    value:totalPass,        color: C.green },
    { label:'❌  Failed',    value:totalFail,        color: totalFail>0 ? C.red : C.green },
    { label:'Pass Rate',    value:`${passRate}%`,  color: parseFloat(passRate)<80 ? C.amber : C.green },
  ];
  kpis.forEach(({ label, value, color }, i) => {
    const r = 6 + i;
    const lc = ws.getCell(r, 4);
    const vc = ws.getCell(r, 5);
    lc.value     = label;
    lc.font      = font({ bold:true });
    lc.fill      = fill(C.grey);
    lc.border    = border(C.greyBorder);
    vc.value     = value;
    vc.font      = font({ size:13, bold:true, color:{ argb:color } });
    vc.border    = border(C.greyBorder);
    vc.alignment = { horizontal:'center', vertical:'middle' };
    ws.getRow(r).height = 22;
  });

  // ── SECTION C: Category Status Table (rows 5-12, cols G-K) ───────────────
  secHeader('G5', '🏁  Category Status & Deployability');
  const cHeaders = ['Category', 'Tests', 'Pass', 'Fail', 'Status', 'Deploy?'];
  cHeaders.forEach((h, i) => {
    const c = ws.getCell(6, 7+i);
    c.value     = h;
    c.font      = font({ bold:true, color:{ argb:C.white } });
    c.fill      = fill(C.green);
    c.border    = border(C.mintGreen);
    c.alignment = { horizontal:'center', vertical:'middle' };
  });
  ws.getRow(6).height = 22;

  let grandTotal=0, grandPass=0, grandFail=0;
  cats.forEach(({ label, steps:cs }, idx) => {
    const pass = cs.filter(s=>s.status==='PASS').length;
    const fail = cs.length - pass;
    const ok   = fail===0 && cs.length>0;
    grandTotal += cs.length; grandPass += pass; grandFail += fail;
    const r = 7 + idx;
    const row = [label, cs.length, pass, fail, ok?'PASS':'FAIL', ok?'DEPLOYABLE':'BLOCKED'];
    row.forEach((v, c) => {
      const cell = ws.getCell(r, 7+c);
      cell.value  = v;
      cell.font   = font({ bold: c>=4 });
      cell.border = border(C.rowBorder);
      cell.alignment = { horizontal: c===0?'left':'center', vertical:'middle' };
      if (c===4 || c===5) {
        cell.fill = fill(ok ? C.lightGreen : C.lightRed);
        cell.font = font({ bold:true, color:{ argb: ok ? C.green : C.red } });
      } else {
        cell.fill = fill(idx%2===0 ? C.white : C.grey);
      }
    });
    ws.getRow(r).height = 19;
  });

  // Totals row
  const tr = 7 + cats.length;
  const totRow = ['OVERALL', grandTotal, grandPass, grandFail,
    grandFail===0?'PASS':'FAIL', grandFail===0?'DEPLOYABLE':'BLOCKED'];
  totRow.forEach((v, c) => {
    const cell = ws.getCell(tr, 7+c);
    cell.value  = v;
    cell.font   = font({ bold:true, color:{ argb: c>=4 ? (grandFail===0 ? C.green : C.red) : C.text } });
    cell.fill   = fill(C.grey);
    cell.border = border(C.greyBorder);
    cell.alignment = { horizontal: c===0?'left':'center', vertical:'middle' };
  });
  ws.getRow(tr).height = 22;

  // ── Note ──────────────────────────────────────────────────────────────────
  const noteRow = tr + 2;
  ws.mergeCells(`A${noteRow}:K${noteRow+1}`);
  const noteCell = ws.getCell(`A${noteRow}`);
  noteCell.value = '📌  This report is auto-generated by the Green Harvest Buddy Selenium E2E Suite. It contains 400 test cases across 4 categories. Refer to the individual tabs (UI-UX Tests, Functional Tests, Unit Tests, Validation Tests) for step-level details, expected/actual values, duration, and timestamps.';
  noteCell.font  = font({ size:9, italic:true, color:{ argb:C.subText } });
  noteCell.alignment = { wrapText:true, vertical:'top' };
  ws.getRow(noteRow).height   = 18;
  ws.getRow(noteRow+1).height = 18;

  // ── Column widths ─────────────────────────────────────────────────────────
  const colW = [28,36,4,22,14,4,28,10,10,10,16,16];
  colW.forEach((w, i) => { ws.getColumn(i+1).width = w; });

  // ════════════════════════════════════════════════════════════════════════════
  // TABS 2-5 — DETAIL LOG PER CATEGORY
  // ════════════════════════════════════════════════════════════════════════════
  const detailHeaders = [
    { header:'Test ID',              key:'id',          width:14 },
    { header:'Module / Feature',     key:'module',      width:22 },
    { header:'Test Description',     key:'description', width:42 },
    { header:'Action Taken',         key:'action',      width:40 },
    { header:'Expected Outcome',     key:'expected',    width:40 },
    { header:'Actual Result',        key:'actual',      width:48 },
    { header:'Status',               key:'status',      width:12 },
    { header:'Duration (ms)',        key:'duration',    width:14 },
    { header:'Timestamp (UTC)',      key:'timestamp',   width:22 },
  ];

  const sheetDefs = [
    { name:'UI-UX Tests',        steps:groups.ui   },
    { name:'Functional Tests',   steps:groups.func },
    { name:'Unit Tests',         steps:groups.unit },
    { name:'Validation Tests',   steps:groups.val  },
  ];

  sheetDefs.forEach(({ name, steps: sheetSteps }) => {
    const wsD = wb.addWorksheet(name);
    wsD.views = [{ showGridLines:true, state:'frozen', ySplit:2 }];

    // sheet banner
    wsD.getRow(1).height = 28;
    wsD.mergeCells(`A1:I1`);
    const shBanner = wsD.getCell('A1');
    shBanner.value     = `🌱  Green Harvest Buddy — ${name}  (${sheetSteps.length} cases)`;
    shBanner.font      = font({ size:12, bold:true, color:{ argb:C.white } });
    shBanner.fill      = fill(C.green);
    shBanner.alignment = { horizontal:'left', vertical:'middle' };

    // header row
    wsD.columns = detailHeaders;
    wsD.getRow(2).height = 26;
    detailHeaders.forEach((h, i) => {
      const cell = wsD.getCell(2, i+1);
      cell.value     = h.header;
      cell.font      = font({ bold:true, color:{ argb:C.white } });
      cell.fill      = fill(C.darkGreen);
      cell.alignment = { horizontal:'center', vertical:'middle', wrapText:true };
      cell.border    = medBorder('top','bottom');
    });

    // data rows
    sheetSteps.forEach((s, idx) => {
      const rNum = idx + 3;
      wsD.getRow(rNum).height = 22;
      const isAlt = idx % 2 !== 0;
      const rowBg = isAlt ? C.grey : C.white;

      const vals = [
        s.id, s.module, s.description, s.action, s.expected,
        s.actual, s.status, s.duration,
        s.timestamp ? s.timestamp.substring(11,19) : '',
      ];
      vals.forEach((v, c) => {
        const cell = wsD.getCell(rNum, c+1);
        cell.value     = v;
        cell.font      = font();
        cell.border    = border(C.rowBorder);
        cell.alignment = { vertical:'middle', wrapText: c>=2 && c<=5 };

        if (c===0) cell.alignment.horizontal = 'center';
        if (c===7) { cell.alignment.horizontal='right'; cell.numFmt='#,##0'; }
        if (c===8) cell.alignment.horizontal = 'center';

        if (c===6) {
          const ok = s.status==='PASS';
          cell.fill = fill(ok ? C.lightGreen : C.lightRed);
          cell.font = font({ bold:true, color:{ argb: ok ? C.green : C.red } });
          cell.alignment.horizontal = 'center';
        } else {
          cell.fill = fill(rowBg);
        }
      });
    });

    // column widths from header defs
    detailHeaders.forEach((h, i) => { wsD.getColumn(i+1).width = h.width; });
  });

  // ── Write file ─────────────────────────────────────────────────────────────
  await wb.xlsx.writeFile(outputPath);
  console.log(`[+] Excel report → ${outputPath}`);
};
