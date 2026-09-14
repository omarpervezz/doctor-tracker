import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";
const email =
  process.env.SCREENSHOT_EMAIL ||
  process.env.SEED_ADMIN_EMAIL ||
  "admin@doctortracker.dev";
const password =
  process.env.SCREENSHOT_PASSWORD ||
  process.env.SEED_ADMIN_PASSWORD ||
  "Admin123!";
const port = Number(process.env.CHROME_DEBUG_PORT || 9222);
const outputDirectory = join(process.cwd(), "public", "screenshots");

const chromeCandidates = [
  process.env.CHROME_PATH,
  "chromium",
  "chromium-browser",
  "google-chrome",
  "google-chrome-stable",
].filter(Boolean);

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    const child = spawn(candidate, ["--version"], { stdio: "ignore" });
    const exitCode = await new Promise((resolve) => {
      child.once("error", () => resolve(-1));
      child.once("exit", (code) => resolve(code ?? -1));
    });
    if (exitCode === 0) return candidate;
  }
  throw new Error(
    "Chrome/Chromium was not found. Set CHROME_PATH to your browser executable.",
  );
}

async function waitForJson(url, attempts = 60) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function waitFor(client, expression, timeout = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    if (result.result?.value) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function navigate(client, url) {
  await client.send("Page.navigate", { url });
  await waitFor(
    client,
    "document.readyState === 'complete' || document.readyState === 'interactive'",
  );
  await sleep(900);
}

async function setViewport(client, width, height, mobile = false) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

async function saveScreenshot(client, filename) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    fromSurface: true,
  });
  await writeFile(join(outputDirectory, filename), result.data, "base64");
  console.log(`Saved public/screenshots/${filename}`);
}

async function login(client) {
  await navigate(client, `${baseUrl}/login`);
  const expression = `(() => {
    const setValue = (element, value) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setValue(document.querySelector('input[name="email"]'), ${JSON.stringify(email)});
    setValue(document.querySelector('input[name="password"]'), ${JSON.stringify(password)});
    document.querySelector('form').requestSubmit();
    return true;
  })()`;
  await client.send("Runtime.evaluate", { expression, awaitPromise: true });
  await waitFor(client, "location.pathname === '/dashboard'", 20000);
  await sleep(1200);
}

async function main() {
  if (typeof WebSocket === "undefined") {
    throw new Error(
      "Screenshot capture requires Node.js 22+ or another runtime with a global WebSocket implementation.",
    );
  }

  await mkdir(outputDirectory, { recursive: true });
  const chrome = await findChrome();
  const profileDirectory = await mkdtemp(join(tmpdir(), "doctor-tracker-chrome-"));
  const browser = spawn(
    chrome,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDirectory}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    const tabs = await waitForJson(`http://127.0.0.1:${port}/json`);
    const tab = tabs.find((item) => item.type === "page");
    if (!tab?.webSocketDebuggerUrl) {
      throw new Error("Unable to find a Chrome page target");
    }

    const client = new CdpClient(tab.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    await setViewport(client, 1440, 1000);
    await navigate(client, `${baseUrl}/login`);
    await saveScreenshot(client, "login-desktop.png");
    await login(client);
    await saveScreenshot(client, "dashboard-desktop.png");

    await navigate(client, `${baseUrl}/doctors`);
    await saveScreenshot(client, "doctors-desktop.png");

    await navigate(client, `${baseUrl}/patients`);
    await saveScreenshot(client, "patients-desktop.png");

    await setViewport(client, 390, 844, true);
    await navigate(client, `${baseUrl}/dashboard`);
    await saveScreenshot(client, "dashboard-mobile.png");

    await navigate(client, `${baseUrl}/doctors`);
    await saveScreenshot(client, "doctors-mobile.png");

    client.close();
  } finally {
    browser.kill("SIGTERM");
    await rm(profileDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
