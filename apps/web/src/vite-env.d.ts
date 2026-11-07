interface ImportMetaEnv {
  readonly VITE_API_MODE?: "local" | "remote";
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
