import dotenv from 'dotenv';
dotenv.config();

export const TARGET_URL = process.env.TEST_URL || 'http://localhost:3000';
export const HEADLESS = process.env.HEADLESS !== 'false'; // default to true for CI/CD

export const TIMEOUTS = {
  implicit: 10000,
  explicit: 15000,
  sleepShort: 1000,
  sleepMedium: 2000,
  sleepLong: 4000
};
