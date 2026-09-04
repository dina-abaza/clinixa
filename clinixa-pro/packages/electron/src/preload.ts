import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('clinixa', {
  appInfo: {
    name: 'Clinixa',
    version: '1.0.0',
  },
  selectFolder: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-folder', defaultPath),
});

export type ClinixaWindow = {
  clinixa: {
    appInfo: {
      name: string;
      version: string;
    };
    selectFolder: (defaultPath?: string) => Promise<string | null>;
  };
};

declare global {
  interface Window {
    clinixa?: ClinixaWindow['clinixa'];
  }
}
