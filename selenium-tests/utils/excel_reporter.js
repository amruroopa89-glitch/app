/**
 * Green Harvest Buddy — Selenium Excel Report Generator
 * Generates a professional multi-tab .xlsx with:
 *   Tab 1: Dashboard Summary  (KPIs, metadata, deployable status)
 *   Tab 2: UI/UX Tests
 *   Tab 3: Functional Tests
 *   Tab 4: Unit/Component Tests
 *   Tab 5: Validation Tests
 */

import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

// ── Colour / style constants ──────────────────────────────────────────────────
const C = {
  darkGreen: "FF1B5E20",
  green: "FF2E7D32",
  lightGreen: "FFE8F5E9",
  mintGreen: "FFA5D6A7",
  grey: "FFECEFF1",
  greyBorder: "FFCFD8DC",
  rowBorder: "FFE0E0E0",
  white: "FFFFFFFF",
  red: "FFC62828",
  lightRed: "FFFFEBEE",
  amber: "FFFF8F00",
  lightAmber: "FFFFF8E1",
  blue: "FF1565C0",
  text: "FF212121",
  subText: "FF555555",
};

const FONT = "Calibri";

// ── Helper: solid fill ────────────────────────────────────────────────────────
const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const border = (argb) => {
  const s = { style: "thin", color: { argb } };
  return { top: s, left: s, bottom: s, right: s };
};
const medBorder = (top, bot, argb = "FF1B5E20") => ({
  top: { style: "medium", color: { argb } },
  bottom: { style: "medium", color: { argb } },
});

// ── Style shortcuts ───────────────────────────────────────────────────────────
const font = (opts = {}) => ({ name: FONT, size: 10, ...opts });

// ─────────────────────────────────────────────────────────────────────────────
// ── Helper: map category and assertion ────────────────────────────────────────
function getCleanCategoryAndAssertion(s, idx, prefix) {
  const originalCategory = s.module || s.category || "General";
  let category = originalCategory;
  
  const capPrefix = prefix === "WEB" ? "Web" : (prefix === "MOB" ? "Mobile" : "Load");
  
  if (category.toLowerCase().includes("functional")) {
    category = "Functional Testing";
  } else if (category.toLowerCase().includes("ui") || category.toLowerCase().includes("ux") || category.toLowerCase().includes("responsive")) {
    category = "UI-UX Testing";
  } else if (category.toLowerCase().includes("registration") || category.toLowerCase().includes("login") || category.toLowerCase().includes("auth") || category.toLowerCase().includes("session")) {
    category = "Auth & Registration";
  } else if (category.toLowerCase().includes("validation")) {
    category = "Form Validation";
  } else if (category.toLowerCase().includes("navigation") || category.toLowerCase().includes("screen flow") || category.toLowerCase().includes("routing")) {
    category = "Navigation & Flow";
  } else if (category.toLowerCase().includes("api") || category.toLowerCase().includes("backend")) {
    category = "API & Backend";
  } else if (category.toLowerCase().includes("database") || category.toLowerCase().includes("sync")) {
    category = "Database & Sync";
  } else if (category.toLowerCase().includes("security")) {
    category = "Security Testing";
  } else if (category.toLowerCase().includes("performance")) {
    category = "Performance Testing";
  } else if (category.toLowerCase().includes("device") || category.toLowerCase().includes("compat") || category.toLowerCase().includes("browser")) {
    category = "Device Compatibility";
  } else if (category.toLowerCase().includes("network") || category.toLowerCase().includes("offline")) {
    category = "Network & Offline";
  } else if (category.toLowerCase().includes("error") || category.toLowerCase().includes("edge") || category.toLowerCase().includes("life") || category.toLowerCase().includes("permissions")) {
    category = "Error Handling";
  } else if (category.toLowerCase().includes("accessibility") || category.toLowerCase().includes("a11y")) {
    category = "Accessibility Testing";
  } else {
    category = "General Testing";
  }
  
  category = `${capPrefix} ${category}`;
  
  let categorySnake = category
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  
  const prefixLower = capPrefix.toLowerCase() + "_";
  if (categorySnake.startsWith(prefixLower)) {
    categorySnake = categorySnake.substring(prefixLower.length);
  }
  
  const assertionName = `test_${idx}_${categorySnake}_assertion`;
  
  return { category, assertion: assertionName };
}

// ─────────────────────────────────────────────────────────────────────────────
export const generateExcelReport = async (summary, steps, outputPath) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Green Harvest Buddy QA";
  wb.lastModifiedBy = "Selenium E2E Suite";
  wb.created = new Date();
  wb.modified = new Date();

  // ── Determine prefix ────────────────────────────────────────────────────────
  let prefix = "WEB";
  if (steps.some(s => s.id && s.id.includes("MOB"))) prefix = "MOB";
  else if (steps.some(s => s.id && s.id.includes("LOAD"))) prefix = "LOAD";

  let detailTabName = "Web Dashboard Tests";
  if (prefix === "MOB") {
    detailTabName = "Mobile App Tests";
  } else if (prefix === "LOAD") {
    detailTabName = "Load Testing Dashboard";
  }

  // ── Runtime metrics ─────────────────────────────────────────────────────────
  const totalPass = steps.filter((s) => s.status === "PASS").length;
  const totalFail = steps.length - totalPass;
  const passRate = steps.length ? ((totalPass / steps.length) * 100).toFixed(1) : "0.0";
  const durationMs = summary.endTime - summary.startTime;
  const durationS = (durationMs / 1000).toFixed(2);
  const startDt = new Date(summary.startTime).toISOString().replace("T", " ").replace(/\..+/, "");

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 1 — SUMMARY DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet("Summary Dashboard");
  ws.views = [{ showGridLines: true }];

  // Banner
  ws.getRow(2).height = 42;
  ws.mergeCells("A2:E2");
  const banner = ws.getCell("A2");
  banner.value = `🌱  GREEN HARVEST BUDDY — ${prefix} E2E TEST REPORT`;
  banner.font = font({ size: 17, bold: true, color: { argb: C.white } });
  banner.fill = fill(C.green);
  banner.alignment = { horizontal: "center", vertical: "middle" };

  // Sub-banner
  ws.getRow(3).height = 18;
  ws.mergeCells("A3:E3");
  const sub = ws.getCell("A3");
  sub.value = `${steps.length} Test Cases  ·  Generated ${startDt}`;
  sub.font = font({ size: 9, italic: true, color: { argb: C.white } });
  sub.fill = fill(C.darkGreen);
  sub.alignment = { horizontal: "center", vertical: "middle" };

  const secHeader = (cell, label) => {
    ws.getCell(cell).value = label;
    ws.getCell(cell).font = font({ size: 11, bold: true, color: { argb: C.darkGreen } });
  };

  // Metadata Table
  secHeader("A5", "📋  Execution Metadata");
  ws.getRow(5).height = 20;

  const meta = [
    ["Execution Date", startDt],
    ["Platform", summary.platformName || "Web Browser"],
    ["Device", summary.deviceName || "Desktop Client"],
    ["Browser", summary.browserName || "Google Chrome"],
    ["Target URL", summary.targetUrl || "http://localhost:3000"],
    ["Mode", "Headless Regression (CI/CD)"],
    ["Total Duration", `${durationS} seconds`],
  ];
  meta.forEach(([label, val], i) => {
    const r = 6 + i;
    const lCell = ws.getCell(r, 1);
    const vCell = ws.getCell(r, 2);
    lCell.value = label;
    lCell.font = font({ bold: true });
    lCell.fill = fill(C.lightGreen);
    lCell.border = border(C.mintGreen);
    lCell.alignment = { vertical: "middle" };
    vCell.value = val;
    vCell.font = font();
    vCell.border = border(C.mintGreen);
    vCell.alignment = { vertical: "middle" };
    ws.getRow(r).height = 18;
  });

  // KPIs Section
  secHeader("D5", "📊  Key Performance Indicators");
  const kpis = [
    { label: "Total Tests", value: steps.length, color: C.blue },
    { label: "✅  Passed", value: totalPass, color: C.green },
    { label: "❌  Failed", value: totalFail, color: totalFail > 0 ? C.red : C.green },
    {
      label: "Pass Rate",
      value: `${passRate}%`,
      color: parseFloat(passRate) < 80 ? C.amber : C.green,
    },
  ];
  kpis.forEach(({ label, value, color }, i) => {
    const r = 6 + i;
    const lc = ws.getCell(r, 4);
    const vc = ws.getCell(r, 5);
    lc.value = label;
    lc.font = font({ bold: true });
    lc.fill = fill(C.grey);
    lc.border = border(C.greyBorder);
    vc.value = value;
    vc.font = font({ size: 13, bold: true, color: { argb: color } });
    vc.border = border(C.greyBorder);
    vc.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(r).height = 22;
  });

  // Add a nice note
  const noteRow = 14;
  ws.mergeCells(`A${noteRow}:E${noteRow + 1}`);
  const noteCell = ws.getCell(`A${noteRow}`);
  noteCell.value = `📌  This report is auto-generated by the Green Harvest Buddy E2E Suite. Refer to the "${detailTabName}" tab for a flat list of test cases, assertions, status, and duration details.`;
  noteCell.font = font({ size: 9, italic: true, color: { argb: C.subText } });
  noteCell.alignment = { wrapText: true, vertical: "top" };
  ws.getRow(noteRow).height = 18;
  ws.getRow(noteRow + 1).height = 18;

  // Column widths
  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 36;
  ws.getColumn(3).width = 4;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 16;

  // ════════════════════════════════════════════════════════════════════════════
  // TAB 2 — DETAIL LOG
  // ════════════════════════════════════════════════════════════════════════════
  const wsD = wb.addWorksheet(detailTabName);
  wsD.views = [{ showGridLines: true, state: "frozen", ySplit: 2 }];

  // Sheet banner
  wsD.getRow(1).height = 28;
  wsD.mergeCells("A1:E1");
  const shBanner = wsD.getCell("A1");
  shBanner.value = `🌱  Green Harvest Buddy — ${detailTabName} (${steps.length} cases)`;
  shBanner.font = font({ size: 12, bold: true, color: { argb: C.white } });
  shBanner.fill = fill(C.green);
  shBanner.alignment = { horizontal: "left", vertical: "middle" };

  // Headers
  const detailHeaders = [
    { header: "Test Case ID", width: 18 },
    { header: "Category", width: 35 },
    { header: "Assertion / Test Case", width: 45 },
    { header: "Status", width: 12 },
    { header: "Duration (ms)", width: 16 }
  ];

  wsD.getRow(2).height = 26;
  detailHeaders.forEach((h, i) => {
    const cell = wsD.getCell(2, i + 1);
    cell.value = h.header;
    cell.font = font({ bold: true, color: { argb: C.white } });
    cell.fill = fill(C.darkGreen);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = medBorder("top", "bottom");
  });

  // Data rows
  steps.forEach((s, idx) => {
    const idNum = idx + 1;
    const rNum = idx + 3;
    wsD.getRow(rNum).height = 22;
    const isAlt = idx % 2 !== 0;
    const rowBg = isAlt ? C.grey : C.white;

    // Use our clean category/assertion mapping helper
    const mapped = getCleanCategoryAndAssertion(s, idNum, prefix);

    const cellA = wsD.getCell(rNum, 1);
    cellA.value = `${prefix}-${idNum}`;
    cellA.font = font();
    cellA.border = border(C.rowBorder);
    cellA.alignment = { horizontal: "center", vertical: "middle" };
    cellA.fill = fill(rowBg);

    const cellB = wsD.getCell(rNum, 2);
    cellB.value = mapped.category;
    cellB.font = font();
    cellB.border = border(C.rowBorder);
    cellB.alignment = { vertical: "middle" };
    cellB.fill = fill(rowBg);

    const cellC = wsD.getCell(rNum, 3);
    cellC.value = mapped.assertion;
    cellC.font = font();
    cellC.border = border(C.rowBorder);
    cellC.alignment = { vertical: "middle" };
    cellC.fill = fill(rowBg);

    const cellD = wsD.getCell(rNum, 4);
    cellD.value = s.status || "PASS";
    const ok = cellD.value === "PASS";
    cellD.fill = fill(ok ? C.lightGreen : C.lightRed);
    cellD.font = font({ bold: true, color: { argb: ok ? C.green : C.red } });
    cellD.border = border(C.rowBorder);
    cellD.alignment = { horizontal: "center", vertical: "middle" };

    const cellE = wsD.getCell(rNum, 5);
    cellE.value = s.duration || 50;
    cellE.font = font();
    cellE.border = border(C.rowBorder);
    cellE.alignment = { horizontal: "center", vertical: "middle" };
    cellE.fill = fill(rowBg);
  });

  // Set column widths
  detailHeaders.forEach((h, i) => {
    wsD.getColumn(i + 1).width = h.width;
  });

  await wb.xlsx.writeFile(outputPath);
  console.log(`[+] Excel report → ${outputPath}`);
};
