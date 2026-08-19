const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'qa', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const tasks = [
  { name: 'home-desktop-1440.png', url: 'http://localhost:3000/portal.html#home', width: 1440, height: 1024 },
  { name: 'home-desktop-1280.png', url: 'http://localhost:3000/portal.html#home', width: 1280, height: 800 },
  { name: 'home-tablet-768.png', url: 'http://localhost:3000/portal.html#home', width: 768, height: 1024 },
  { name: 'home-mobile-430.png', url: 'http://localhost:3000/portal.html#home', width: 430, height: 932 },
  { name: 'home-mobile-390.png', url: 'http://localhost:3000/portal.html#home', width: 390, height: 844 },
  { name: 'home-mobile-360.png', url: 'http://localhost:3000/portal.html#home', width: 360, height: 800 },

  { name: 'results-desktop.png', url: 'http://localhost:3000/portal.html#results', width: 1440, height: 1024 },
  { name: 'results-mobile.png', url: 'http://localhost:3000/portal.html#results', width: 390, height: 844 },

  { name: 'profile-desktop.png', url: 'http://localhost:3000/portal.html#profile', width: 1440, height: 1024 },
  { name: 'profile-mobile.png', url: 'http://localhost:3000/portal.html#profile', width: 390, height: 844 },

  { name: 'evaluations-desktop.png', url: 'http://localhost:3000/index.html', width: 1440, height: 1024 },
  { name: 'evaluations-mobile.png', url: 'http://localhost:3000/index.html', width: 390, height: 844 }
];

async function run() {
  const tmpProfile = path.join(os.tmpdir(), 'chrome_qa_' + Date.now());
  console.log('Capturing all 12 screenshots with Chrome Headless...');
  for (const task of tasks) {
    const outPath = path.join(OUTPUT_DIR, task.name);
    const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --no-sandbox --no-first-run --no-default-browser-check --user-data-dir="${tmpProfile}" --hide-scrollbars --virtual-time-budget=2000 --run-all-compositor-stages-before-draw --window-size=${task.width},${task.height} --screenshot="${outPath}" "${task.url}"`;
    try {
      execSync(cmd, { timeout: 15000, stdio: 'ignore' });
      if (fs.existsSync(outPath)) {
        const stats = fs.statSync(outPath);
        console.log(`[OK] ${task.name} (${stats.size} bytes)`);
      } else {
        console.log(`[WARN] Not written: ${task.name}`);
      }
    } catch (err) {
      console.error(`[ERR] ${task.name}:`, err.message);
    }
  }
  try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch {}
}

run();
