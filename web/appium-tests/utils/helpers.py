"""
Appium helper utilities — element interaction, screenshots, safe waits.
"""

import os
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC


def sleep(seconds: float):
    """Pause execution."""
    time.sleep(seconds)


def _by(selector: str):
    """Auto-detect XPath vs CSS selector."""
    if selector.startswith("/") or selector.startswith("(") or selector.startswith(".."):
        return By.XPATH, selector
    return By.CSS_SELECTOR, selector


def wait_for_element(driver, selector, timeout=10):
    """Wait until element is visible and return it."""
    by, path = _by(selector)
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, path))
    )


def wait_present(driver, selector, timeout=10):
    """Wait until element is present in DOM (may not be visible)."""
    by, path = _by(selector)
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, path))
    )


def click(driver, selector, timeout=10):
    """Wait for element to be clickable and click it."""
    by, path = _by(selector)
    el = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, path))
    )
    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
        sleep(0.15)
    except Exception:
        pass
    try:
        el.click()
    except Exception:
        driver.execute_script("arguments[0].click();", el)


def type_text(driver, selector, text, timeout=10):
    """Clear field then type text."""
    el = wait_for_element(driver, selector, timeout)
    el.clear()
    el.send_keys(text)


def select_dropdown_by_value(driver, selector, value, timeout=10):
    """Select an <option> by its value attribute."""
    el = wait_for_element(driver, selector, timeout)
    select = Select(el)
    try:
        select.select_by_value(value)
    except Exception:
        select.select_by_visible_text(value)


def take_screenshot(driver, step_id, reports_dir):
    """Capture viewport screenshot and save to reports/screenshots/."""
    ss_dir = os.path.join(reports_dir, "screenshots")
    os.makedirs(ss_dir, exist_ok=True)
    safe = "".join(c if c.isalnum() else "_" for c in step_id.lower())
    fname = f"{safe}_{int(time.time()*1000)}.png"
    fpath = os.path.join(ss_dir, fname)
    try:
        driver.save_screenshot(fpath)
        return fpath
    except Exception as e:
        print(f"[-] Screenshot failed for {step_id}: {e}")
        return None


def body_text(driver):
    """Return visible body text safely."""
    try:
        return driver.find_element(By.TAG_NAME, "body").text
    except Exception:
        return ""


def current_url(driver):
    """Return current URL safely."""
    try:
        return driver.current_url
    except Exception:
        return ""


def go_to(driver, url):
    """Navigate and wait briefly."""
    driver.get(url)
    sleep(2)
    return current_url(driver)


def css_value(driver, selector, prop):
    """Get CSS property value of an element."""
    el = wait_for_element(driver, selector)
    return el.value_of_css_property(prop)


def get_attr(driver, selector, attr):
    """Get attribute of an element."""
    el = wait_for_element(driver, selector)
    return el.get_attribute(attr)
