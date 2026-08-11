export type AuthStackParamList = {
  Welcome: undefined;
  Auth: { mode: "signin" | "signup" } | undefined;
  ResetPassword: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Crops: undefined;
  Assistant: undefined;
  Diagnose: undefined;
  Profile: undefined;
};
