import fs from 'fs';
import path from 'path';
import { By, until } from 'selenium-webdriver';
import { TIMEOUTS } from '../config.js';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getByStrategy = (selector) => {
  if (selector.startsWith('/') || selector.startsWith('(') || selector.startsWith('..')) {
    return By.xpath(selector);
  } else {
    return By.css(selector);
  }
};

export const waitForElement = async (driver, selector, timeout = TIMEOUTS.explicit) => {
  const by = getByStrategy(selector);
  return await driver.wait(until.elementLocated(by), timeout);
};

export const click = async (driver, selector, timeout = TIMEOUTS.explicit) => {
  const by = getByStrategy(selector);
  const element = await driver.wait(until.elementLocated(by), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.wait(until.elementIsEnabled(element), timeout);
  
  // Try to scroll into view
  try {
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
    await sleep(200);
  } catch (err) {
    // ignore scroll issues
  }

  await element.click();
};

export const typeText = async (driver, selector, text, timeout = TIMEOUTS.explicit) => {
  const by = getByStrategy(selector);
  const element = await driver.wait(until.elementLocated(by), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.clear();
  await element.sendKeys(text);
};

export const selectDropdown = async (driver, selector, value, timeout = TIMEOUTS.explicit) => {
  const by = getByStrategy(selector);
  const element = await driver.wait(until.elementLocated(by), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  
  // Find option and click it
  const option = await element.findElement(By.css(`option[value="${value}"]`));
  await option.click();
};

export const takeScreenshot = async (driver, stepId, reportsDir) => {
  const screenshotDir = path.join(reportsDir, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const safeStepId = stepId.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${safeStepId}_${Date.now()}.png`;
  const fullPath = path.join(screenshotDir, filename);

  try {
    const data = await driver.takeScreenshot();
    fs.writeFileSync(fullPath, data, 'base64');
    return fullPath;
  } catch (err) {
    console.error(`[-] Failed to capture screenshot for step ${stepId}: ${err.message}`);
    return null;
  }
};
