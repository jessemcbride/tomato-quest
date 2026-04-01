import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const targetUrl = process.env.SCREENSHOT_URL || 'http://127.0.0.1:4173/';
const outputFile = process.env.SCREENSHOT_OUTPUT || 'builds/latest.png';
const commitSha = process.env.COMMIT_SHA || 'unknown';
const runId = process.env.GITHUB_RUN_ID || 'local';
const capturedAt = new Date().toISOString();

await mkdir(dirname(outputFile), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60_000 });
await page.screenshot({ path: outputFile, fullPage: true });
await browser.close();

const indexFile = 'builds/index.html';
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>TomatoQuest Build Screenshots</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; }
    img { max-width: 100%; border: 1px solid #ddd; }
    code { background: #f3f3f3; padding: 0.1rem 0.3rem; }
  </style>
</head>
<body>
  <h1>TomatoQuest Build Screenshots</h1>
  <p>Commit: <code>${commitSha}</code></p>
  <p>Run ID: <code>${runId}</code></p>
  <p>Captured at: <code>${capturedAt}</code></p>
  <p><a href="latest.png">Open latest screenshot</a></p>
  <img src="latest.png" alt="Latest build screenshot" />
</body>
</html>`;

await writeFile(indexFile, html, 'utf8');
