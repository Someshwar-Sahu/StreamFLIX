const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const webDir = path.join(__dirname, '..', 'web');
const webBuildDest = path.join(__dirname, 'web-build');

console.log('Building web app...');
execSync('pnpm build', { cwd: webDir, stdio: 'inherit' });

console.log('Copying build output...');
if (fs.existsSync(webBuildDest)) {
  fs.rmSync(webBuildDest, { recursive: true, force: true });
}
fs.cpSync(path.join(webDir, 'dist'), webBuildDest, { recursive: true });

console.log('Done — web-build is up to date.');