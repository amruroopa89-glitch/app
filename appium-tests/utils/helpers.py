import os
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

def sleep(seconds):
    """Pause execution for a given time in seconds."""
    time.sleep(seconds)

def _get_by_strategy(selector):
    """Automatically determines if selector is XPath or CSS Selector."""
    if selector.startswith("/") or selector.startswith("(") or selector.startswith(".."):
        return By.XPATH, selector
    else:
        return By.CSS_SELECTOR, selector

def wait_for_element(driver, selector, timeout=10):
    """Waits for an element to be visible and returns it."""
    by, path = _get_by_strategy(selector)
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, path))
    )

def click(driver, selector, timeout=10):
    """Waits for an element to be clickable and clicks it."""
    by, path = _get_by_strategy(selector)
    element = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, path))
    )
    element.click()

def type_text(driver, selector, text, timeout=10):
    """Waits for an element, clears it, and inputs text."""
    element = wait_for_element(driver, selector, timeout)
    element.clear()
    element.send_keys(text)

def select_dropdown_by_value(driver, selector, value, timeout=10):
    """Waits for a select dropdown element and selects an option by value attribute."""
    element = wait_for_element(driver, selector, timeout)
    select = Select(element)
    select.select_by_value(value)

def take_screenshot(driver, step_id, reports_dir):
    """Captures a screenshot of the current viewport and saves it to reports/screenshots/."""
    screenshot_dir = os.path.join(reports_dir, "screenshots")
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir, exist_ok=True)
        
    safe_step_id = "".join([c if c.isalnum() else "_" for c in step_id.lower()])
    filename = f"{safe_step_id}_{int(time.time() * 1000)}.png"
    full_path = os.path.join(screenshot_dir, filename)
    
    try:
        driver.save_screenshot(full_path)
        return full_path
    except Exception as e:
        print(f"[-] Failed to capture screenshot for step {step_id}: {str(e)}")
        return None
