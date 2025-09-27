/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string; // your env variable
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
