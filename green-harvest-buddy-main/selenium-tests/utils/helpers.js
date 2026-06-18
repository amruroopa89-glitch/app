import fs   from 'fs';
import path from 'path';
import { By, until, Key } from 'selenium-webdriver';
import { TIMEOUTS } from '../config.js';

// ── Basic timing ─────────────────────────────────────────────────────────────
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Selector strategy ────────────────────────────────────────────────────────
const byOf = (sel) =>
  sel.startsWith('/') || sel.startsWith('(') || sel.startsWith('..')
    ? By.xpath(sel)
    : By.css(sel);

// ── Wait helpers ─────────────────────────────────────────────────────────────
export const waitForElement = async (driver, selector, timeout = TIMEOUTS.explicit) => {
  const by = byOf(selector);
  return driver.wait(until.elementLocated(by), timeout);
};

export const waitVisible = async (driver, selector, timeout = TIMEOUTS.explicit) => {
  const el = await waitForElement(driver, selector, timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
};

// ── Click (scroll-safe) ───────────────────────────────────────────────────────
export const click = async (driver, selector, timeout = TIMEOUTS.explicit) => {
  const by = byOf(selector);
  const el = await driver.wait(until.elementLocated(by), timeout);
  await driver.wait(until.elementIsEnabled(el), timeout);
  try { await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el); await sleep(150); } catch (_) {}
  try { await el.click(); }
  catch (_) { await driver.executeScript("arguments[0].click();", el); }
};

// ── Type text (clear first) ──────────────────────────────────────────────────
export const typeText = async (driver, selector, text, timeout = TIMEOUTS.explicit) => {
  const el = await waitVisible(driver, selector, timeout);
  await el.clear();
  await el.sendKeys(text);
};

// ── Select <select> option by visible text ───────────────────────────────────
export const selectDropdown = async (driver, selector, value, timeout = TIMEOUTS.explicit) => {
  const by = byOf(selector);
  const el = await driver.wait(until.elementLocated(by), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  // Try option by value first, then by visible text
  try {
    const opt = await el.findElement(By.css(`option[value="${value}"]`));
    await opt.click();
  } catch (_) {
    const opts = await el.findElements(By.css('option'));
    for (const o of opts) {
      const t = await o.getText();
      if (t.trim().toLowerCase() === value.toLowerCase()) { await o.click(); break; }
    }
  }
};

// ── Screenshot ───────────────────────────────────────────────────────────────
export const takeScreenshot = async (driver, stepId, reportsDir) => {
  const dir = path.join(reportsDir, 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fname = `${stepId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.png`;
  const fpath = path.join(dir, fname);
  try {
    const data = await driver.takeScreenshot();
    fs.writeFileSync(fpath, data, 'base64');
    return fpath;
  } catch (err) {
    console.error(`[-] Screenshot failed for ${stepId}: ${err.message}`);
    return null;
  }
};

// ── Get text safely ──────────────────────────────────────────────────────────
export const bodyText = async (driver) => {
  try { return await driver.findElement(By.tagName('body')).getText(); } catch (_) { return ''; }
};

// ── Navigate and wait ────────────────────────────────────────────────────────
export const goTo = async (driver, url) => {
  await driver.get(url);
  await sleep(TIMEOUTS.sleepMedium);
  return driver.getCurrentUrl();
};

// ── Current URL ──────────────────────────────────────────────────────────────
export const currentUrl = async (driver) => driver.getCurrentUrl();

// ── CSS value helper ─────────────────────────────────────────────────────────
export const cssValue = async (driver, selector, prop) => {
  const el = await waitForElement(driver, selector);
  return el.getCssValue(prop);
};

// ── Attribute helper ─────────────────────────────────────────────────────────
export const getAttribute = async (driver, selector, attr) => {
  const el = await waitForElement(driver, selector);
  return el.getAttribute(attr);
};
