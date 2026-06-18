/// <reference types="vite/client" />
export {};

interface SolidStartMetaEnv {
  START_SSR: string;
  START_ISLANDS: string;
  START_DEV_OVERLAY: string;
  SERVER_BASE_URL: string;
}

interface ImportMetaEnv extends ImportMetaEnv, SolidStartMetaEnv {}

declare module "solid-js" {
  namespace JSX {
    interface CSSProperties {
      [key: string]: string | number | undefined;
    }
  }
}
