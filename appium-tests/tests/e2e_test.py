"""
Green Harvest Buddy — Appium Mobile E2E Test Suite (Modular orchestrator)
Imports split categories and executes them sequentially to compile a combined report.

Run: python tests/e2e_test.py
"""

import sys
import os

# Allow absolute imports from project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.test_runner import configure_sdk_and_appium, stop_appium, run_category, generate_combined_report
from tests.test_ui import run_ui_tests
from tests.test_functional import run_functional_tests
from tests.test_unit import run_unit_tests
from tests.test_validation import run_validation_tests


def run_all():
    print("[+] Starting Green Harvest Buddy Appium Mobile E2E Suite (Modular)...")
    
    # 1. Setup SDK paths and start Appium server if not active
    configure_sdk_and_appium()
    
    try:
        # 2. Run each category sequentially
        ui_res   = run_category("UI-UX Tests", run_ui_tests)
        func_res = run_category("Functional Tests", run_functional_tests)
        unit_res = run_category("Unit Tests", run_unit_tests)
        val_res  = run_category("Validation Tests", run_validation_tests)
        
        all_results = [ui_res, func_res, unit_res, val_res]
        
        # 3. Aggregate all results into the final Excel report
        generate_combined_report(all_results)
        
        print("[✅] All Appium E2E test categories completed successfully!")
    finally:
        # 4. Clean up Appium server process
        stop_appium()


if __name__ == "__main__":
    run_all()
