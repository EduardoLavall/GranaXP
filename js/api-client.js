(function () {
  "use strict";

  const API_BASE = "/api";
  let saveTimer = null;
  let pendingState = null;
  let lastSyncError = null;

  function canUseApi() {
    return location.protocol === "https:" || location.protocol === "http:";
  }

  async function request(path, options = {}) {
    if (!canUseApi()) throw new Error("API unavailable outside http(s)");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        signal: controller.signal,
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      lastSyncError = null;
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadState() {
    const data = await request("/state", { method: "GET" });
    return data.state || null;
  }

  async function flushSave() {
    const state = pendingState;
    pendingState = null;
    if (!state) return;
    try {
      await request("/state", { method: "PUT", body: JSON.stringify({ state }) });
      document.dispatchEvent(new CustomEvent("granaxp:sync", { detail: { ok: true } }));
    } catch (error) {
      lastSyncError = error;
      console.warn("GranaXP remote sync failed; local save was kept.", error);
      document.dispatchEvent(new CustomEvent("granaxp:sync", { detail: { ok: false, message: error.message } }));
    }
  }

  function saveState(state) {
    if (!canUseApi()) return Promise.resolve(false);
    pendingState = JSON.parse(JSON.stringify(state));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 450);
    return Promise.resolve(true);
  }

  async function health() {
    return request("/health", { method: "GET" });
  }

  window.GranaApi = {
    canUseApi,
    loadState,
    saveState,
    health,
    lastSyncError: () => lastSyncError
  };
})();
