declare type Indexes<T = any> = { [s: string | number]: T };

declare interface CustomReactParams {
  params: {
    lng: import('@/locales/i18n').Lng;
  };
}

declare interface CustomReactLayout extends CustomReactParams {
  children: React.ReactNode;
}

declare function fbq(...arg: any): void;
declare function onTelegramAuth(user: any): void;

declare interface Window {
  Telegram: {
    /**
     * @see https://core.telegram.org/bots/webapps#initializing-mini-apps
     */
    WebApp: any;
  };
}
