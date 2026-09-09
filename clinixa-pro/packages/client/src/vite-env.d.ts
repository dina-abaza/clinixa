/// <reference types="vite/client" />

interface ClinixaApi {
  appInfo: {
    name: string;
    version: string;
  };
  selectFolder?: (defaultPath?: string) => Promise<string | null>;
  selectFile?: (defaultPath?: string) => Promise<string | null>;
  getPathForFile?: (file: File) => string;
}

declare global {
  interface Window {
    clinixa?: ClinixaApi;
  }
}

export {};
