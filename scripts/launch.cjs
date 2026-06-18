const net = require('net');
const http = require('http');
const { exec, execSync, spawn } = require('child_process');
const path = require('path');

const PORT = 5186;
const URL = `http://localhost:${PORT}`;

// Checks if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is free
    });
    server.listen(port, '127.0.0.1');
  });
}

// Checks if our app is already running on the URL
function isAppResponding(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      // If we get a response (typically 200 for index.html), it's active
      resolve(res.statusCode === 200);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Opens the default browser
function openBrowser(url) {
  const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${startCmd} ${url}`, (err) => {
    if (err) {
      console.error('Failed to automatically open browser:', err.message);
    }
  });
}

// Keeps the console window open when an error occurs
function keepConsoleOpen() {
  console.log('\n===================================================');
  console.log('Press Enter to exit...');
  console.log('===================================================');
  process.stdin.resume();
  process.stdin.on('data', () => {
    process.exit(1);
  });
}

// Kills zombie processes listening on the port (Windows only)
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    console.log(`Port ${port} is occupied. Attempting to resolve port conflict...`);
    if (process.platform !== 'win32') {
      console.log('Automatic port conflict resolution is only supported on Windows. Skipping...');
      resolve(false);
      return;
    }

    try {
      // Find the PID of the process listening on the port
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      let killedAny = false;

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const proto = parts[0];
        const state = parts[3];
        
        if (proto === 'TCP' && state === 'LISTENING') {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            console.log(`Found conflicting process (PID: ${pid}) listening on port ${port}. Terminating...`);
            execSync(`taskkill /F /PID ${pid}`);
            killedAny = true;
          }
        }
      }

      if (killedAny) {
        console.log('Conflict process terminated. Waiting for OS to free port...');
        setTimeout(() => resolve(true), 1500); // Wait 1.5s for OS socket to close
      } else {
        console.log('No active listening process found to terminate.');
        resolve(false);
      }
    } catch (err) {
      console.error(`Could not automatically free port ${port}:`, err.message);
      resolve(false);
    }
  });
}

// Main execution logic
async function main() {
  console.log('===================================================');
  console.log('   PERSONAL FINANCE WEB APPLICATION LAUNCHER');
  console.log('===================================================');
  console.log(`Target Port: ${PORT}`);
  console.log('');

  const inUse = await isPortInUse(PORT);
  if (inUse) {
    console.log(`Port ${PORT} is currently active.`);
    const appActive = await isAppResponding(URL);
    if (appActive) {
      console.log(`Application is ALREADY running at ${URL}!`);
      console.log('Opening browser tab to show the dashboard...');
      openBrowser(URL);
      // Exit cleanly (no error, process finishes)
      setTimeout(() => process.exit(0), 1000);
      return;
    } else {
      // Port is occupied but not by our active dashboard. Try to free it.
      const freed = await killProcessOnPort(PORT);
      if (!freed) {
        console.error(`\nERROR: Port ${PORT} is occupied by another process and could not be freed.`);
        console.error('Please close any other application using this port and try again.');
        keepConsoleOpen();
        return;
      }
    }
  }

  // Start the server
  console.log('Starting local Vite development server...');
  const projectRoot = path.join(__dirname, '..');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  // Spawn the npm run dev command inside the project root
  const serverProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: true,
  });

  let serverOutput = '';
  let serverReady = false;

  serverProcess.stdout.on('data', (data) => {
    const str = data.toString();
    serverOutput += str;
    process.stdout.write(str);
  });

  serverProcess.stderr.on('data', (data) => {
    const str = data.toString();
    serverOutput += str;
    process.stderr.write(str);
  });

  serverProcess.on('error', (err) => {
    console.error('\nFailed to start Vite dev server process:', err.message);
    keepConsoleOpen();
  });

  serverProcess.on('exit', (code) => {
    if (!serverReady) {
      console.error(`\nServer process exited prematurely with code ${code}.`);
      console.error('Server logs:\n', serverOutput);
      keepConsoleOpen();
    }
  });

  // Poll server readiness
  console.log('Waiting for dev server to become available...');
  let pollAttempts = 0;
  const pollLimit = 60; // 15 seconds limit (60 * 250ms)

  const checkInterval = setInterval(async () => {
    pollAttempts++;
    const ready = await isAppResponding(URL);
    if (ready) {
      serverReady = true;
      clearInterval(checkInterval);
      console.log(`\nSuccess! Dev server is active at ${URL}`);
      console.log('Launching browser...');
      openBrowser(URL);
    } else if (pollAttempts >= pollLimit) {
      clearInterval(checkInterval);
      console.error(`\nERROR: Timeout. Vite server did not respond at ${URL} within 15 seconds.`);
      console.error('Please check for syntax or TypeScript errors shown above.');
      keepConsoleOpen();
    }
  }, 250);
}

main().catch((err) => {
  console.error('Unhandled Launcher Error:', err);
  keepConsoleOpen();
});
