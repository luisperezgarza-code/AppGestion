interface ImportMetaEnv {
  readonly VITE_API_MODE?: "local" | "remote";
  readonly VITE_API_URL?: string;
  readonly VITE_USE_LOCAL_STORAGE?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
