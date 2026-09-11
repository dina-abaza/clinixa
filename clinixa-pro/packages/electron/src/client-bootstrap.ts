import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export function startEmbeddedClient(): ChildProcess {
  const clientDir = path.resolve(__dirname, '../../client');

  const child = spawn('npx', ['vite', '--port', '5173'], {
    cwd: clientDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
    },
  });

  child.on('exit', (code) => {
    console.log(`Embedded Vite client exited with code ${code}`);
  });

  return child;
}
