# AI Crop Recommendation System

This repository contains both the Web and Mobile applications for the AI Crop Recommendation System. The repository is structured into two separate, independent subfolders:

- **`/web`**: The React.js web application (built with TanStack Start, TailwindCSS, and Supabase).
- **`/mobile`**: The standalone React Native mobile application (built with React Navigation, Lucide icons, and Supabase).

---

## 📂 Project Structure

```
project/
├── web/                  # React.js Web Application
│   ├── src/              # Source code (routes, components, lib, etc.)
│   ├── package.json      # Web dependencies
│   └── ...
└── mobile/               # React Native Mobile Application
    ├── src/              # Mobile source code
    │   ├── config/       # API and configurations
    │   ├── navigation/   # Root and Stack navigators
    │   ├── screens/      # Onboarding, Auth, Dashboard, Crops, Chat, Diagnose, Profile
    │   └── services/     # Supabase and API clients
    ├── package.json      # Mobile dependencies
    └── ...
```

---

## 🌐 Web Application (`/web`)

The web application handles the web frontend, Supabase database triggers, and AI processing backend via server endpoints.

### Setup & Run

1. Navigate to the web folder:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs on `http://localhost:8080`):
   ```bash
   npm run dev
   ```

---

## 📱 Mobile Application (`/mobile`)

The mobile application is a native React Native application optimized for Android devices.

### Connect to Local Backend (Vite / TanStack Start Server)
The mobile application communicates with the web server for AI recommendations, chat replies, and leaf diagnostics.
By default, the API base URL is configured in `mobile/src/config/api.ts`.
- **Android Emulator**: Uses `http://10.0.2.2:8080` to loop back to the host machine's localhost.
- **iOS Simulator / Real Device**: Point to your machine's local IP address (e.g. `http://192.168.1.XX:8080`).

### Setup & Run

1. Open your Android Emulator (via Android Studio) or connect a physical developer device.
2. Open a terminal and navigate to the mobile folder:
   ```bash
   cd mobile
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Metro bundler:
   ```bash
   npm start
   ```
5. Run on your emulator/device:
   - **Android**:
     ```bash
     npx react-native run-android
     ```
   - **iOS** (Requires macOS and Xcode):
     ```bash
     npx react-native run-ios
     ```

---

## 🛠️ Testing AI Features on Emulators
To easily validate the AI capabilities in emulator environments where physical camera feeds and file uploads are restricted, the mobile app includes:
1. **Category Quick Triggers**: Instantly query crop, fertilizer, or irrigation help in the Assistant Chat with one tap.
2. **Farming Leaf Presets**: Test plant disease diagnosis with preset mock-leaf configurations (Tomato Spot, Cotton Aphids, Rice Blast, and Non-Leaf) that send base64 payloads to call Gemini vision models on the backend.
