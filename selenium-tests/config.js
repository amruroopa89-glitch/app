import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export const TARGET_URL = process.env.TEST_URL || 'http://localhost:8080';
export const HEADLESS   = process.env.HEADLESS !== 'false'; // default true (CI-friendly)

export const TIMEOUTS = {
  implicit : 10_000,
  explicit  : 15_000,
  sleepShort: 800,
  sleepMedium: 2_000,
  sleepLong : 4_000,
};

export const TEST_USER = {
  name    : 'QA Farmer Selenium',
  mobile  : '9876543210',
  email   : `qa_sel_${Date.now()}@greentest.dev`,
  password: 'GreenQA@2025!',
};
