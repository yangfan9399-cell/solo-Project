/// <reference types="vite/client" />
/// <reference types="node" />

declare global {
  const _$DEBUG: (...args: any[]) => void;

  interface ImportMeta {
    env: ImportMetaEnv;
    glob: <T = any>(
      pattern: string,
      options?: any
    ) => Record<string, () => Promise<T>>;
  }
}

declare module "solid-start/session/cookieSigning" {
  export function signCookie(secret: string, value: string): Promise<string>;
  export function unsignCookie(
    secret: string,
    value: string
  ): Promise<string | false>;
}

export {};
