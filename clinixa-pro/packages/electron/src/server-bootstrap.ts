import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export function startEmbeddedServer(): ChildProcess {
  const serverDir = path.resolve(__dirname, '../../server');

  const child = spawn('npx', ['ts-node-dev', '-r', 'tsconfig-paths/register', '--respawn', '--transpile-only', 'src/server.ts'], {
    cwd: serverDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '4321',
    },
  });

  child.on('exit', (code) => {
    console.log(`Embedded server exited with code ${code}`);
  });

  return child;
}
