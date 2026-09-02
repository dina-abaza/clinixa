import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('clinixa', {
  appInfo: {
    name: 'Clinixa',
    version: '1.0.0',
  },
});

type ClinixaWindow = {
  clinixa: {
    appInfo: {
      name: string;
      version: string;
    };
  };
};

declare global {
  interface Window {
    clinixa: ClinixaWindow['clinixa'];
  }
}
