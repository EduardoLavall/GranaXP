(function () {
  "use strict";

  const KEY = "granaxp_save_v1";
  const VERSION = 1;
  const today = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  };

  function idealState() {
    return {
      version: VERSION,
      player: { name: "Alex", level: 4, xp: 975, coins: 128, lifetimeCoins: 128, streak: 6 },
      budget: { monthly: 2500 },
      transactions: [
        { id: "base-1", value: 850, category: "contas", description: "Aluguel", date: today() },
        { id: "base-2", value: 320, category: "alimentacao", description: "Mercado", date: today() },
        { id: "base-3", value: 99, category: "contas", description: "Internet", date: today() },
        { id: "base-4", value: 146, category: "transporte", description: "Transporte do mês", date: today() },
        { id: "base-5", value: 180, category: "lazer", description: "Lazer", date: today() }
      ],
      dailyXpLogs: 2,
      quests: {
        registrar: { progress: 2, target: 3, claimed: false, xp: 20, coins: 5 },
        revisar: { progress: 0, target: 1, claimed: false, xp: 10, coins: 0 },
        categorizar: { progress: 3, target: 5, claimed: false, xp: 15, coins: 3 },
        semanal: { claimed: false, xp: 100, coins: 25 }
      },
      upgrades: { scanner: false, shield: false, slot: false, redHud: false, goldenWallet: false },
      achievements: { firstExpense: true, streaker: false, budgetWarrior: false, coinHoarder: true, levelFive: false, questMaster: false },
      stats: { questsCompleted: 3, expensesLogged: 8 },
      preferences: { wizardTheme: false },
      updatedAt: Date.now()
    };
  }

  function freshState() {
    const state = idealState();
    state.player = { name: "Alex", level: 1, xp: 0, coins: 0, lifetimeCoins: 0, streak: 1 };
    state.transactions = [];
    state.dailyXpLogs = 0;
    state.quests.registrar.progress = 0;
    state.quests.revisar.progress = 0;
    state.quests.categorizar.progress = 0;
    Object.keys(state.upgrades).forEach((key) => { state.upgrades[key] = false; });
    Object.keys(state.achievements).forEach((key) => { state.achievements[key] = false; });
    state.stats = { questsCompleted: 0, expensesLogged: 0 };
    return state;
  }

  function normalize(state) {
    const base = idealState();
    if (!state || state.version !== VERSION) return base;
    return {
      ...base,
      ...state,
      player: { ...base.player, ...state.player },
      budget: { ...base.budget, ...state.budget },
      quests: { ...base.quests, ...state.quests },
      upgrades: { ...base.upgrades, ...state.upgrades },
      achievements: { ...base.achievements, ...state.achievements },
      stats: { ...base.stats, ...state.stats },
      preferences: { ...base.preferences, ...state.preferences },
      transactions: Array.isArray(state.transactions) ? state.transactions : base.transactions
    };
  }

  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
    catch { return idealState(); }
  }

  function saveLocal(state, dispatch = true) {
    state.version = VERSION;
    state.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    if (dispatch) document.dispatchEvent(new CustomEvent("granaxp:saved"));
  }

  function save(state) {
    saveLocal(state, true);
    window.GranaApi?.saveState?.(state);
  }

  async function hydrateRemote() {
    if (!window.GranaApi?.canUseApi?.()) return load();
    try {
      const remote = await window.GranaApi.loadState();
      if (remote) {
        const normalized = normalize(remote);
        saveLocal(normalized, false);
        document.dispatchEvent(new CustomEvent("granaxp:hydrated", { detail: { source: "google-sheets" } }));
        return normalized;
      }

      const local = load();
      window.GranaApi.saveState(local);
      document.dispatchEvent(new CustomEvent("granaxp:hydrated", { detail: { source: "local-seed" } }));
      return local;
    } catch (error) {
      console.warn("Google Sheets unavailable; using localStorage.", error);
      document.dispatchEvent(new CustomEvent("granaxp:hydrated", { detail: { source: "local-fallback", error: error.message } }));
      return load();
    }
  }

  function reset(mode = "ideal") {
    const state = mode === "fresh" ? freshState() : idealState();
    save(state);
    return state;
  }

  window.GranaStorage = { KEY, load, save, reset, hydrateRemote, idealState, freshState, today };
})();
