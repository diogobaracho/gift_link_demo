/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API origin when the API is not served from the same origin. */
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
