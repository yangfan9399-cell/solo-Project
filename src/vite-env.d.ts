/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_PLATFORM: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
