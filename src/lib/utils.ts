import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

declare global {
  var _AppConfigEnv: {
    origin: string;
    HOST: string;
    LNG: string;
    DOMAIN: string;
    CLIENTID: string;
    WSS: string;
    OSS: string;
    DOWNLOADAPI: string;
    APPVERSIONCODE: number;
    APPTYPE: string;
    APPNAME: string;
    GOOGLE_GAID: string;
    isTG?: boolean;
    TG_BOT_NAME?: string;
    TG_APP_NAME?: string;
    NODE_ENV?: string;
    /**
     * 开启角色发送图片功能
     */
    OPEN_SEND_IMG?: boolean;
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getAppConfigEnv = (
  _origin?: string
): typeof globalThis._AppConfigEnv => {
  const origin = _origin
    ? _origin
    : typeof window === "undefined"
    ? ""
    : window.origin;

  if (origin.includes("https://www.arabicloveai.com")) {
    return {
      origin,
      HOST: "https://api.arabicloveai.com",
      LNG: "en",
      DOMAIN: "loveai.us.auth0.com",
      CLIENTID: "tHWvBAEeGJZQetuKn3MiiaY9YI0S75KD",
      WSS: "wss://api.arabicloveai.com/",
      OSS: "https://static.ailov3.com/",
      DOWNLOADAPI: "https://api.arabicloveai.com/util/file/download/",
      OPEN_SEND_IMG: true,
      APPVERSIONCODE: 101,
      APPTYPE: "H5",
      APPNAME: "Ai girl friend",
      GOOGLE_GAID: "G-Q6F43G8FDB",
    };
  } else if (origin.includes("https://www.perfectmanloveai.com")) {
    return {
      origin,
      HOST: "https://api.acgnusa.com",
      LNG: "en",
      DOMAIN: "loveai.us.auth0.com",
      CLIENTID: "45H1py2bZWkAcwYioLSlkYPugkHf4Wvw",
      WSS: "wss://api.acgnusa.com/",
      OSS: "https://static.ailov3.com/",
      DOWNLOADAPI: "https://api.acgnusa.com/util/file/download/",
      APPVERSIONCODE: 101,
      APPTYPE: "H5",
      APPNAME: "Ai girl friend",
      GOOGLE_GAID: "G-DYK3EZT3B6",
    };
  } else if (origin.includes("https://www.telegramloveai.com")) {
    return {
      isTG: true,
      TG_BOT_NAME: "AIFriendchat_bot",
      TG_APP_NAME: "AIFriendchat",
      origin,
      HOST: "https://api.telegramloveai.com",
      LNG: "en",
      DOMAIN: "loveai.us.auth0.com",
      CLIENTID: "OdQJpSYXilu8n3dgT6syFD2av9EI6UJw",
      WSS: "wss://api.telegramloveai.com/",
      OSS: "https://static.ailov3.com/",
      DOWNLOADAPI: "https://api.telegramloveai.com/util/file/download/",
      OPEN_SEND_IMG: true,
      APPVERSIONCODE: 101,
      APPTYPE: "H5",
      APPNAME: "Ai girl friend",
      GOOGLE_GAID: "G-46HPB8YJYG",
    };
  } else if (origin.includes("https://127.0.0.1:3000")) {
    return {
      isTG: true,
      TG_BOT_NAME: "AIFriendchat_bot",
      TG_APP_NAME: "AIFriendchat",
      origin,
      HOST: "https://api.arabicloveai.com.com",
      LNG: "en",
      DOMAIN: "loveai.us.auth0.com",
      CLIENTID: "OdQJpSYXilu8n3dgT6syFD2av9EI6UJw",
      WSS: "wss://api.arabicloveai.com.com/",
      OSS: "https://static.ailov3.com/",
      DOWNLOADAPI: "https://api.arabicloveai.com.com/util/file/download/",
      OPEN_SEND_IMG: true,
      APPVERSIONCODE: 101,
      APPTYPE: "H5",
      APPNAME: "Ai girl friend",
      GOOGLE_GAID: "G-46HPB8YJYG",
    };
  } else {
    return {
      isTG: true,
      TG_BOT_NAME: "AIFriendchat_bot",
      TG_APP_NAME: "AIFriendchat",
      origin,
      HOST: "https://api.telegramloveai.com",
      LNG: "en",
      DOMAIN: "loveai.us.auth0.com",
      CLIENTID: "OdQJpSYXilu8n3dgT6syFD2av9EI6UJw",
      WSS: "wss://api.telegramloveai.com/",
      OSS: "https://static.ailov3.com/",
      DOWNLOADAPI: "https://api.telegramloveai.com/util/file/download/",
      OPEN_SEND_IMG: true,
      APPVERSIONCODE: 101,
      APPTYPE: "H5",
      APPNAME: "Ai girl friend",
      GOOGLE_GAID: "G-46HPB8YJYG",
    };
  }
};

class Singleton {
  private static _instance: Singleton;
  private AppConfigEnv: typeof globalThis._AppConfigEnv;
  private constructor() {
    this.AppConfigEnv = getAppConfigEnv(
      typeof window === "undefined"
        ? process.env.NEXT_ORIGIN || "https://www.perfectmanloveai.com"
        : origin
    );
    if (process.env.NODE_ENV === "development") {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Replacement).
      global._AppConfigEnv = this.AppConfigEnv;
    }
  }

  public static get instance() {
    if (!this._instance) {
      this._instance = new Singleton();
    }
    return this._instance.AppConfigEnv;
  }
}
const AppConfigEnv = Singleton.instance;

export default AppConfigEnv;

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { AppConfigEnv };
