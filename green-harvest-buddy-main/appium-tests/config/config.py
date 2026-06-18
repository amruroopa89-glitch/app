import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Appium Server Connection
APPIUM_HOST = os.getenv("APPIUM_HOST", "127.0.0.1")
APPIUM_PORT = os.getenv("APPIUM_PORT", "4723")
# In Appium 2.x, the base path is usually '/'
APPIUM_PATH = os.getenv("APPIUM_PATH", "/")

clean_path = APPIUM_PATH.strip("/")
if clean_path:
    APPIUM_SERVER_URL = f"http://{APPIUM_HOST}:{APPIUM_PORT}/{clean_path}"
else:
    APPIUM_SERVER_URL = f"http://{APPIUM_HOST}:{APPIUM_PORT}"

# Target Web Application URL
# 'http://10.0.2.2:3000' is the localhost redirection from inside standard Android Emulator
TARGET_URL = os.getenv("TEST_URL", "http://10.0.2.2:3000")

# Mobile device options/capabilities
capabilities = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": os.getenv("ANDROID_DEVICE_NAME", "Android Emulator"),
    "browserName": os.getenv("BROWSER_NAME", "Chrome"),
    
    # Enable Webview & screenshots optimizations
    "ensureWebviewsHavePages": True,
    "nativeWebScreenshot": True,
    "newCommandTimeout": 300,
    
    # Uncomment and configure below if testing a compiled APK package instead of browser
    # "app": os.getenv("ANDROID_APK_PATH", "./apps/app-debug.apk"),
    # "appPackage": "com.green.harvestbuddy",
    # "appActivity": "com.green.harvestbuddy.MainActivity"
}

# Timeout Configurations
IMPLICIT_WAIT_TIMEOUT = 10
EXPLICIT_WAIT_TIMEOUT = 15
