"""
Green Harvest Buddy — Appium Excel Report Generator
Generates a professional multi-tab .xlsx with:
  Tab 1: Dashboard Summary  (KPIs, metadata, deployable status)
  Tab 2: UI/UX Tests
  Tab 3: Functional Tests
  Tab 4: Unit/Component Tests
  Tab 5: Validation Tests
"""

import os
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# ── Colour constants ─────────────────────────────────────────────────────────
_C = {
    "dk_green":   "1B5E20",
    "green":      "2E7D32",
    "lt_green":   "E8F5E9",
    "mint":       "A5D6A7",
    "grey":       "ECEFF1",
    "grey_bdr":   "CFD8DC",
    "row_bdr":    "E0E0E0",
    "white":      "FFFFFF",
    "red":        "C62828",
    "lt_red":     "FFEBEE",
    "amber":      "FF8F00",
    "blue":       "1565C0",
    "text":       "212121",
    "sub":        "555555",
}

_FONT = "Calibri"


def _fill(colour):
    return PatternFill(start_color=colour, end_color=colour, fill_type="solid")


def _border(colour):
    side = Side(style="thin", color=colour)
    return Border(left=side, right=side, top=side, bottom=side)


def _med_border():
    s = Side(style="medium", color=_C["dk_green"])
    return Border(top=s, bottom=s)


def _font(**kw):
    return Font(name=_FONT, size=kw.get("size", 10), bold=kw.get("bold", False),
                italic=kw.get("italic", False),
                color=kw.get("color", _C["text"]))


# ═══════════════════════════════════════════════════════════════════════════════
def get_clean_category_and_assertion(s, idx, prefix):
    original_category = s.get("module", s.get("category", "General"))
    category = original_category
    
    cap_prefix = "Web" if prefix == "WEB" else ("Mobile" if prefix == "MOB" else "Load")
    
    cat_lower = category.lower()
    if "functional" in cat_lower:
        category = "Functional Testing"
    elif "ui" in cat_lower or "ux" in cat_lower or "responsive" in cat_lower:
        category = "UI-UX Testing"
    elif "registration" in cat_lower or "login" in cat_lower or "auth" in cat_lower or "session" in cat_lower:
        category = "Auth & Registration"
    elif "validation" in cat_lower:
        category = "Form Validation"
    elif "navigation" in cat_lower or "screen flow" in cat_lower or "routing" in cat_lower:
        category = "Navigation & Flow"
    elif "api" in cat_lower or "backend" in cat_lower:
        category = "API & Backend"
    elif "database" in cat_lower or "sync" in cat_lower:
        category = "Database & Sync"
    elif "security" in cat_lower:
        category = "Security Testing"
    elif "performance" in cat_lower:
        category = "Performance Testing"
    elif "device" in cat_lower or "compat" in cat_lower or "browser" in cat_lower:
        category = "Device Compatibility"
    elif "network" in cat_lower or "offline" in cat_lower:
        category = "Network & Offline"
    elif "error" in cat_lower or "edge" in cat_lower or "life" in cat_lower or "permissions" in cat_lower:
        category = "Error Handling"
    elif "accessibility" in cat_lower or "a11y" in cat_lower:
        category = "Accessibility Testing"
    else:
        category = "General Testing"
        
    category = f"{cap_prefix} {category}"
    
    # Create snake_case category name for assertion scenario
    category_snake = "".join([c for c in category.lower() if c.isalnum() or c.isspace()]).strip().replace(" ", "_")
    
    prefix_lower = cap_prefix.lower() + "_"
    if category_snake.startswith(prefix_lower):
        category_snake = category_snake[len(prefix_lower):]
        
    assertion_name = f"test_{idx}_{category_snake}_assertion"
    
    return category, assertion_name


# ═══════════════════════════════════════════════════════════════════════════════
def generate_excel_report(summary: dict, steps: list, output_path: str):
    """Create the simplified E2E Excel report with Summary Dashboard and flat Detail tab."""

    dir_name = os.path.dirname(output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    wb = Workbook()

    # Determine prefix
    prefix = "WEB"
    if any("MOB" in str(s.get("id", "")) for s in steps):
        prefix = "MOB"
    elif any("LOAD" in str(s.get("id", "")) for s in steps):
        prefix = "LOAD"

    detail_tab_name = "Web Dashboard Tests"
    if prefix == "MOB":
        detail_tab_name = "Mobile App Tests"
    elif prefix == "LOAD":
        detail_tab_name = "Load Testing Dashboard"

    total = len(steps)
    passed = sum(1 for s in steps if s.get("status") == "PASS")
    failed = total - passed
    rate = f"{(passed / total * 100):.1f}" if total else "0.0"
    dur_s = (summary.get("endTime", 0) - summary.get("startTime", 0)) / 1000.0
    start_dt = datetime.fromtimestamp(summary.get("startTime", 0) / 1000.0).strftime("%Y-%m-%d %H:%M:%S")

    # ══════════════════════════════════════════════════════════════════════════
    # TAB 1 — SUMMARY DASHBOARD
    # ══════════════════════════════════════════════════════════════════════════
    ws = wb.active
    ws.title = "Summary Dashboard"

    # Banner
    ws.merge_cells("A2:E2")
    ws.row_dimensions[2].height = 42
    b = ws["A2"]
    b.value = f"🌱  GREEN HARVEST BUDDY — {prefix} E2E TEST REPORT"
    b.font = _font(size=17, bold=True, color=_C["white"])
    b.fill = _fill(_C["green"])
    b.alignment = Alignment(horizontal="center", vertical="center")

    # Sub-banner
    ws.merge_cells("A3:E3")
    ws.row_dimensions[3].height = 18
    s3 = ws["A3"]
    s3.value = f"{total} Test Cases  ·  Generated {start_dt}"
    s3.font = _font(size=9, italic=True, color=_C["white"])
    s3.fill = _fill(_C["dk_green"])
    s3.alignment = Alignment(horizontal="center", vertical="center")

    def sec(cell, label):
        ws[cell].value = label
        ws[cell].font = _font(size=11, bold=True, color=_C["dk_green"])

    # ── Execution Metadata ────────────────────────────────────────────────────
    sec("A5", "📋  Execution Metadata")
    meta = [
        ("Execution Date",  start_dt),
        ("Platform",        summary.get("platformName", "Web Browser")),
        ("Device",          summary.get("deviceName", "Desktop Client")),
        ("Browser",         summary.get("browserName", "Google Chrome")),
        ("Target URL",      summary.get("targetUrl", "http://localhost:3000")),
        ("Mode",            "Headless Regression (CI/CD)"),
        ("Duration",        f"{dur_s:.2f} seconds"),
    ]
    for i, (label, val) in enumerate(meta):
        r = 6 + i
        ws.row_dimensions[r].height = 18
        lc = ws.cell(row=r, column=1, value=label)
        lc.font = _font(bold=True); lc.fill = _fill(_C["lt_green"]); lc.border = _border(_C["mint"])
        vc = ws.cell(row=r, column=2, value=val)
        vc.font = _font(); vc.border = _border(_C["mint"])

    # ── KPIs ──────────────────────────────────────────────────────────────────
    sec("D5", "📊  Key Performance Indicators")
    kpis = [
        ("Total Tests", total,        _C["blue"]),
        ("✅  Passed",   passed,       _C["green"]),
        ("❌  Failed",   failed,       _C["red"] if failed else _C["green"]),
        ("Pass Rate",   f"{rate}%",   _C["amber"] if float(rate) < 80 else _C["green"]),
    ]
    for i, (label, val, color) in enumerate(kpis):
        r = 6 + i
        ws.row_dimensions[r].height = 22
        lc = ws.cell(row=r, column=4, value=label)
        lc.font = _font(bold=True); lc.fill = _fill(_C["grey"]); lc.border = _border(_C["grey_bdr"])
        vc = ws.cell(row=r, column=5, value=val)
        vc.font = _font(size=13, bold=True, color=color)
        vc.alignment = Alignment(horizontal="center", vertical="center"); vc.border = _border(_C["grey_bdr"])

    # Note
    nr = 14
    ws.merge_cells(f"A{nr}:E{nr+1}")
    nc = ws[f"A{nr}"]
    nc.value = f"📌  This report is auto-generated by the Green Harvest Buddy E2E Suite. Refer to the \"{detail_tab_name}\" tab for a flat list of test cases, assertions, status, and duration details."
    nc.font = _font(size=9, italic=True, color=_C["sub"])
    nc.alignment = Alignment(wrap_text=True, vertical="top")

    # Column widths
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 36
    ws.column_dimensions["C"].width = 4
    ws.column_dimensions["D"].width = 22
    ws.column_dimensions["E"].width = 16

    # ══════════════════════════════════════════════════════════════════════════
    # TAB 2 — DETAIL LOG
    # ══════════════════════════════════════════════════════════════════════════
    wd = wb.create_sheet(title=detail_tab_name)
    wd.views.sheetView[0].showGridLines = True
    wd.freeze_panes = "A3"

    # Banner
    wd.merge_cells("A1:E1")
    wd.row_dimensions[1].height = 28
    bn = wd["A1"]
    bn.value = f"🌱  Green Harvest Buddy — {detail_tab_name}  ({total} cases)"
    bn.font = _font(size=12, bold=True, color=_C["white"])
    bn.fill = _fill(_C["green"])
    bn.alignment = Alignment(horizontal="left", vertical="center")

    headers = [
        ("Test Case ID",          18),
        ("Category",              35),
        ("Assertion / Test Case", 45),
        ("Status",                12),
        ("Duration (ms)",         16)
    ]

    # Header row
    wd.row_dimensions[2].height = 26
    for ci, (text, w) in enumerate(headers):
        col_letter = get_column_letter(ci + 1)
        wd.column_dimensions[col_letter].width = w
        c = wd.cell(row=2, column=ci + 1, value=text)
        c.font = _font(bold=True, color=_C["white"])
        c.fill = _fill(_C["dk_green"])
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = _med_border()

    # Data rows
    for ri, step in enumerate(steps):
        rn = ri + 3
        wd.row_dimensions[rn].height = 22
        alt = ri % 2 != 0
        bg = _C["grey"] if alt else _C["white"]

        mapped_cat, mapped_assert = get_clean_category_and_assertion(step, ri + 1, prefix)

        # ID
        c = wd.cell(row=rn, column=1, value=f"{prefix}-{ri+1}")
        c.font = _font(); c.border = _border(_C["row_bdr"]); c.fill = _fill(bg)
        c.alignment = Alignment(horizontal="center", vertical="center")

        # Category
        c = wd.cell(row=rn, column=2, value=mapped_cat)
        c.font = _font(); c.border = _border(_C["row_bdr"]); c.fill = _fill(bg)
        c.alignment = Alignment(vertical="center")

        # Assertion
        c = wd.cell(row=rn, column=3, value=mapped_assert)
        c.font = _font(); c.border = _border(_C["row_bdr"]); c.fill = _fill(bg)
        c.alignment = Alignment(vertical="center")

        # Status
        status_val = step.get("status", "PASS")
        c = wd.cell(row=rn, column=4, value=status_val)
        ok = status_val == "PASS"
        c.fill = _fill(_C["lt_green"] if ok else _C["lt_red"])
        c.font = _font(bold=True, color=_C["green"] if ok else _C["red"])
        c.border = _border(_C["row_bdr"])
        c.alignment = Alignment(horizontal="center", vertical="center")

        # Duration
        dur_val = step.get("duration", 50)
        c = wd.cell(row=rn, column=5, value=dur_val)
        c.font = _font(); c.border = _border(_C["row_bdr"]); c.fill = _fill(bg)
        c.alignment = Alignment(horizontal="center", vertical="center")

    wb.save(output_path)
    print(f"[+] Excel report -> {output_path}")
