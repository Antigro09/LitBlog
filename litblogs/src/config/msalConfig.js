import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "68975491-3428-4424-bb26-63bd8f7a75ad",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:5173",
    postLogoutRedirectUri: "http://localhost:5173",
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
      logLevel: LogLevel.Info,
    }
  }
};

export const loginRequest = {
  scopes: ["https://graph.microsoft.com/User.Read"],
  prompt: "select_account"
};