/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MINT_PRICE: string;
  readonly VITE_MINT_COUNT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
