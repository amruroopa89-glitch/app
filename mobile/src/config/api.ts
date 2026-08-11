import { Platform } from "react-native";

// In Android emulator, 10.0.2.2 maps to the host machine's localhost.
// In iOS simulator, localhost maps directly to the host machine's localhost.
export const API_BASE_URL = Platform.select({
  android: "http://10.0.2.2:8080",
  ios: "http://localhost:8080",
  default: "http://localhost:8080",
});
