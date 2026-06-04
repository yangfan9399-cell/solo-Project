/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SITE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
