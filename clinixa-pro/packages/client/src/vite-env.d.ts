/// <reference types="vite/client" />

interface ClinixaApi {
  appInfo: {
    name: string;
    version: string;
  };
  selectFolder?: (defaultPath?: string) => Promise<string | null>;
}

declare global {
  interface Window {
    clinixa?: ClinixaApi;
  }
}

export {};
