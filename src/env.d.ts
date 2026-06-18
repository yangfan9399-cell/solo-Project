/// <reference types="vite/client" />
export {};

declare module "solid-js" {
  namespace JSX {
    interface CSSProperties {
      [key: string]: string | number | undefined;
    }
  }
}
