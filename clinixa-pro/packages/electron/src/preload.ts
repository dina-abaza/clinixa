import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('clinixa', {
  appInfo: {
    name: 'Clinixa',
    version: '1.0.0',
  },
  selectFolder: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-folder', defaultPath),
  selectFile: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-file', defaultPath),
  getPathForFile: (file: File): string => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch {}
    return (file as any).path || file.name;
  },
});

export type ClinixaWindow = {
  clinixa: {
    appInfo: {
      name: string;
      version: string;
    };
    selectFolder: (defaultPath?: string) => Promise<string | null>;
    selectFile: (defaultPath?: string) => Promise<string | null>;
    getPathForFile?: (file: File) => string;
  };
};

declare global {
  interface Window {
    clinixa?: ClinixaWindow['clinixa'];
  }
}
