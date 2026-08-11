import os
from dotenv import load_dotenv

# Load environment variables from project root .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_dotenv()

# ── Appium Server ────────────────────────────────────────────────────────────
APPIUM_HOST = os.getenv("APPIUM_HOST", "127.0.0.1")
APPIUM_PORT = os.getenv("APPIUM_PORT", "4723")
APPIUM_PATH = os.getenv("APPIUM_PATH", "/").strip("/")

APPIUM_SERVER_URL = (
    f"http://{APPIUM_HOST}:{APPIUM_PORT}/{APPIUM_PATH}"
    if APPIUM_PATH
    else f"http://{APPIUM_HOST}:{APPIUM_PORT}"
)

# ── Target Web App URL ──────────────────────────────────────────────────────
# 10.0.2.2 = localhost from inside Android emulator
TARGET_URL = os.getenv("TEST_URL", "http://10.0.2.2:8080")

# ── Appium capabilities ─────────────────────────────────────────────────────
capabilities = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": os.getenv("ANDROID_DEVICE_NAME", "Android Emulator"),
    "browserName": os.getenv("BROWSER_NAME", "Chrome"),
    "ensureWebviewsHavePages": True,
    "nativeWebScreenshot": True,
    "newCommandTimeout": 300,
    # Uncomment for APK testing:
    # "app": os.getenv("ANDROID_APK_PATH", "./apps/app-debug.apk"),
    # "appPackage": "com.green.harvestbuddy",
    # "appActivity": "com.green.harvestbuddy.MainActivity",
}

# ── Timeouts ─────────────────────────────────────────────────────────────────
IMPLICIT_WAIT  = 10
EXPLICIT_WAIT  = 15

# ── Test user credentials ────────────────────────────────────────────────────
import time
_ts = int(time.time())
TEST_USER = {
    "name": "QA Farmer Appium",
    "mobile": "9876501234",
    "email": f"qa_appium_{_ts}@greentest.dev",
    "password": "GreenQA@2025!",
}
