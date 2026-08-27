process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/margen';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

const { spawn } = require('child_process');
const path = require('path');

const apiDir = path.resolve(__dirname, '..', 'apps', 'api');
const tsxBin = path.join(apiDir, 'node_modules', '.bin', 'tsx.CMD');

const child = spawn(tsxBin, ['src/main.ts'], {
  cwd: apiDir,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  console.log(`API exited with code ${code}`);
});
