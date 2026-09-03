import fs from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.GRANAXP_CDP || "http://127.0.0.1:9222";
const base = process.env.GRANAXP_URL || "http://127.0.0.1:8080";
const root = process.cwd();
const artifacts = path.join(root, "tests", "artifacts");
const downloads = path.join(root, "tests", "downloads");
await fs.mkdir(artifacts, { recursive: true });
await fs.mkdir(downloads, { recursive: true });

const tabInfo = await fetch(`${endpoint}/json/new?${encodeURIComponent(`${base}/slides.html`)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(tabInfo.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });

let nextId = 1;
const pending = new Map();
const events = new Map();
const consoleErrors = [];
const failedResponses = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message));
    else item.resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text || "Exceção sem descrição");
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") consoleErrors.push(message.params.entry.text);
  if (message.method === "Network.responseReceived" && message.params.response.status >= 400) failedResponses.push(`${message.params.response.status} ${message.params.response.url}`);
  const listeners = events.get(message.method) || [];
  listeners.splice(0).forEach((resolve) => resolve(message.params));
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
function once(method) { return new Promise((resolve) => events.set(method, [...(events.get(method) || []), resolve])); }
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Falha de avaliação");
  return result.result.value;
}
async function waitFor(expression, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(`Tempo esgotado: ${expression}`);
}
async function navigate(url) {
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  await waitFor("document.readyState === 'complete'");
}
async function screenshot(name) {
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.writeFile(path.join(artifacts, name), Buffer.from(result.data, "base64"));
}

await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Log.enable"), send("Network.enable")]);
await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads, eventsEnabled: true });
await waitFor("window.GranaSlides && window.GranaExport && document.querySelectorAll('.slide').length === 13");

const slideReport = await evaluate(`(async () => {
  const result = [];
  for (let i = 0; i < window.GranaSlides.slides.length; i += 1) {
    await window.GranaSlides.goTo(i, true);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const slide = window.GranaSlides.slides[i];
    result.push({ numero: i + 1, titulo: slide.querySelector('h1,h2')?.textContent.trim(), largura: slide.clientWidth, altura: slide.clientHeight, excessoX: slide.scrollWidth - slide.clientWidth, excessoY: slide.scrollHeight - slide.clientHeight });
  }
  await window.GranaSlides.goTo(0, true);
  return result;
})()`);
for (let i = 0; i < 13; i += 1) {
  await evaluate(`window.GranaSlides.goTo(${i}, true)`);
  await screenshot(`slide-${String(i + 1).padStart(2,"0")}-1366x768.png`);
}
await evaluate("window.GranaSlides.goTo(0, true)");

await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))`);
await waitFor("location.hash === '#slide-2'");
await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
await waitFor("document.querySelector('#overview').hidden === false");
const overviewCount = await evaluate("document.querySelectorAll('.overview-thumb').length");
await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
await waitFor("document.querySelector('#overview').hidden === true");
await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'h',bubbles:true}))`);
await waitFor("document.querySelector('#help-dialog').open === true");
await evaluate("document.querySelector('#help-dialog').close()");

const libraries = await evaluate("({captura:!!window.html2canvas,pdf:!!window.jspdf?.jsPDF,powerpoint:!!window.PptxGenJS})");
await evaluate("window.GranaExport.run('pdf')");
await waitFor("document.querySelector('#export-status').textContent === 'PDF PRONTO'", 30000);
await new Promise((resolve) => setTimeout(resolve, 1000));
await evaluate("window.GranaExport.run('pptx')");
await waitFor("document.querySelector('#export-status').textContent === 'POWERPOINT PRONTO'", 45000);
await new Promise((resolve) => setTimeout(resolve, 1500));

await navigate(`${base}/demo.html?reset=1`);
await waitFor("window.GranaStorage && document.querySelector('#continue-game')");
await evaluate("document.querySelector('#continue-game').click()");
await waitFor("document.querySelector('#game-shell').hidden === false");
await waitFor("document.querySelector('#boot-screen').hidden === true");
await screenshot("demo-painel-1366x768.png");

await evaluate(`(() => {
  document.querySelector('#open-expense').click();
  const form = document.querySelector('#expense-form');
  form.elements.value.value = '35';
  form.elements.category.value = 'alimentacao';
  form.elements.description.value = 'Pizza';
  form.elements.date.value = new Date().toISOString().slice(0,10);
  form.requestSubmit();
})()`);
await waitFor("JSON.parse(localStorage.getItem('granaxp_save_v1')).quests.registrar.claimed === true");
await waitFor("document.querySelector('#reward-dialog').open === true");
const scriptedState = await evaluate("(() => { const s=JSON.parse(localStorage.getItem('granaxp_save_v1')); return {nivel:s.player.level,xp:s.player.xp,moedas:s.player.coins,gasto:s.transactions.reduce((a,b)=>a+b.value,0),missao:s.quests.registrar.claimed}; })()");
for (let i = 0; i < 3; i += 1) {
  if (!await evaluate("document.querySelector('#reward-dialog').open")) await new Promise((resolve) => setTimeout(resolve, 500));
  if (!await evaluate("document.querySelector('#reward-dialog').open")) break;
  await evaluate("document.querySelector('#reward-continue').click()");
  await new Promise((resolve) => setTimeout(resolve, 280));
}
await evaluate("document.querySelector('[data-page=\"melhorias\"]').click()");
await waitFor("document.querySelector('[data-buy=\"scanner\"]')");
await evaluate("document.querySelector('[data-buy=\"scanner\"]').click()");
const purchaseState = await evaluate("(() => { const s=JSON.parse(localStorage.getItem('granaxp_save_v1')); return {moedas:s.player.coins,scanner:s.upgrades.scanner}; })()");
await evaluate("document.querySelector('[data-page=\"gastos\"]').click()");
await waitFor("document.querySelector('[data-delete-transaction]')");
await evaluate("document.querySelector('[data-delete-transaction^=\"gasto-\"]').click()");
const deletionState = await evaluate("(() => { const s=JSON.parse(localStorage.getItem('granaxp_save_v1')); return {xp:s.player.xp,missao:s.quests.registrar.claimed,gasto:s.transactions.reduce((a,b)=>a+b.value,0)}; })()");

await navigate(`${base}/demo.html`);
const persistenceState = await evaluate("(() => { const s=JSON.parse(localStorage.getItem('granaxp_save_v1')); return {scanner:s.upgrades.scanner,xp:s.player.xp,missao:s.quests.registrar.claimed}; })()");
await navigate(`${base}/demo.html?reset=1`);
const resetState = await evaluate("(() => { const s=JSON.parse(localStorage.getItem('granaxp_save_v1')); return {nivel:s.player.level,xp:s.player.xp,moedas:s.player.coins,gasto:s.transactions.reduce((a,b)=>a+b.value,0),missao:s.quests.registrar.progress}; })()");

await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await navigate(`${base}/slides.html`);
await waitFor("window.GranaSlides");
const desktop1920 = await evaluate(`(async () => {
  const result=[];
  for(let i=0;i<13;i+=1){await window.GranaSlides.goTo(i,true);await new Promise(r=>requestAnimationFrame(r));const s=window.GranaSlides.slides[i];result.push({numero:i+1,excessoX:s.scrollWidth-s.clientWidth,excessoY:s.scrollHeight-s.clientHeight});}
  return result;
})()`);
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await navigate(`${base}/demo.html`);
await evaluate("document.querySelector('#continue-game').click()");
await waitFor("document.querySelector('#boot-screen').hidden === true");
const mobile390 = await evaluate("({largura:innerWidth,excessoHorizontal:document.documentElement.scrollWidth-innerWidth,menuMovel:getComputedStyle(document.querySelector('#mobile-menu')).display,painelVisivel:!!document.querySelector('.dashboard-grid')})");

await new Promise((resolve) => setTimeout(resolve, 1200));
const downloadFiles = await fs.readdir(downloads);
const report = { slides: slideReport, desktop1920, mobile390, overviewCount, libraries, scriptedState, purchaseState, deletionState, persistenceState, resetState, downloads: downloadFiles, consoleErrors, failedResponses };
await fs.writeFile(path.join(artifacts, "relatorio.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
socket.close();
