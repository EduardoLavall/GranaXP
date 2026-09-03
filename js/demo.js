(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icon = (name, className) => window.GranaIcons.icon(name, className);
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  const thresholds = [0, 200, 450, 700, 1000, 1350, 1750, 2200, 2700];
  const categoryMap = {
    alimentacao: { label: "ALIMENTAÇÃO", icon: "food" }, transporte: { label: "TRANSPORTE", icon: "transport" },
    lazer: { label: "LAZER", icon: "entertainment" }, contas: { label: "CONTAS", icon: "bills" },
    saude: { label: "SAÚDE", icon: "health" }, educacao: { label: "EDUCAÇÃO", icon: "education" },
    outros: { label: "OUTROS", icon: "other" }
  };
  const pages = {
    painel: ["VISÃO GERAL", "PAINEL DO JOGADOR"], gastos: ["INVENTÁRIO FINANCEIRO", "GASTOS"],
    missoes: ["OBJETIVOS ATIVOS", "MISSÕES"], melhorias: ["LOJA DE PROGRESSÃO", "MELHORIAS"],
    conquistas: ["MARCOS DA JORNADA", "CONQUISTAS"], perfil: ["STATUS DO JOGADOR", "PERFIL"],
    configuracoes: ["SISTEMA", "CONFIGURAÇÕES"]
  };
  const upgradeData = [
    { key: "scanner", icon: "graph", name: "LEITOR DE ORÇAMENTO", price: 30, level: 1, description: "Libera uma visualização avançada do orçamento." },
    { key: "shield", icon: "shield", name: "ESCUDO DE SEQUÊNCIA", price: 50, level: 3, description: "Item cosmético para proteger visualmente sua sequência." },
    { key: "slot", icon: "scroll", name: "ESPAÇO DE MISSÃO", price: 75, level: 4, description: "Libera um espaço extra para futuras missões." },
    { key: "redHud", icon: "flame", name: "TEMA HUD VERMELHO", price: 100, level: 4, description: "Ativa uma variação rubra da interface." },
    { key: "goldenWallet", icon: "wallet", name: "CARTEIRA DOURADA", price: 150, level: 5, description: "Moldura premium e totalmente cosmética." }
  ];
  const achievementData = [
    { key: "firstExpense", icon: "sword", name: "PRIMEIRO PASSO", description: "Registre o primeiro gasto." },
    { key: "streaker", icon: "flame", name: "SEM PARAR", description: "Alcance uma sequência de 7 dias." },
    { key: "budgetWarrior", icon: "shield", name: "GUERREIRO DO ORÇAMENTO", description: "Feche a semana abaixo do orçamento." },
    { key: "coinHoarder", icon: "coin", name: "COLECIONADOR", description: "Acumule 100 moedas virtuais." },
    { key: "levelFive", icon: "level", name: "NÍVEL CINCO", description: "Alcance o nível 5." },
    { key: "questMaster", icon: "trophy", name: "MESTRE DAS MISSÕES", description: "Conclua 10 missões." }
  ];

  let state = window.GranaStorage.load();
  let currentPage = "painel";
  let rewardQueue = [];
  let rewardShowing = false;
  let logoClicks = 0;

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function spent() { return state.transactions.reduce((sum, item) => sum + Number(item.value || 0), 0); }
  function available() { return state.budget.monthly - spent(); }
  function levelFromXp(xp) {
    let level = 1;
    thresholds.forEach((value, index) => { if (xp >= value) level = index + 1; });
    return Math.min(level, thresholds.length);
  }
  function nextThreshold(level) { return thresholds[level] ?? thresholds.at(-1) + 600; }
  function xpPercent() {
    const previous = thresholds[state.player.level - 1] || 0;
    const next = nextThreshold(state.player.level);
    return Math.max(0, Math.min(100, (state.player.xp - previous) / (next - previous) * 100));
  }
  function budgetStatus() {
    const ratio = spent() / state.budget.monthly;
    if (ratio >= .9) return { label: "ORÇAMENTO EM RISCO", cls: "pixel-progress--danger", color: "var(--danger)" };
    if (ratio >= .7) return { label: "ATENÇÃO AO ORÇAMENTO", cls: "pixel-progress--warning", color: "var(--warning)" };
    return { label: "ORÇAMENTO SEGURO", cls: "pixel-progress--green", color: "var(--success)" };
  }
  function formatDate(value) { try { return dateFormat.format(new Date(`${value}T12:00:00`)); } catch { return value; } }
  function progressPercent(quest) { return Math.min(100, quest.progress / quest.target * 100); }

  function persist() { window.GranaStorage.save(state); }
  function savedPulse() {
    const indicator = $("#save-indicator");
    indicator.classList.remove("is-visible");
    void indicator.offsetWidth;
    indicator.classList.add("is-visible");
  }
  function toast(title, text) {
    const node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span>`;
    $("#toast-stack").appendChild(node);
    setTimeout(() => node.remove(), 2900);
  }
  function floatXp(amount) {
    const node = document.createElement("div");
    node.className = "xp-float";
    node.textContent = `+${amount} XP`;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1400);
  }
  function particles(color = "var(--gold)", count = 22) {
    const x = innerWidth / 2;
    const y = innerHeight / 2;
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("i");
      particle.className = "pixel-particle";
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 220;
      Object.assign(particle.style, {
        "--x": `${x}px`, "--y": `${y}px`, "--size": `${[4,6,8][i % 3]}px`, "--color": color,
        "--dx": `${Math.cos(angle) * distance}px`, "--dy": `${Math.sin(angle) * distance}px`, "--rot": `${Math.random() * 180}deg`
      });
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 850);
    }
  }
  function flash() { const node = document.createElement("i"); node.className = "screen-flash"; document.body.appendChild(node); setTimeout(() => node.remove(), 550); }

  function enqueueReward(item) { rewardQueue.push(item); if (!rewardShowing) setTimeout(showNextReward, item.delay || 280); }
  function showNextReward() {
    if (!rewardQueue.length) { rewardShowing = false; return; }
    rewardShowing = true;
    const item = rewardQueue.shift();
    $("#reward-icon").innerHTML = icon(item.icon || "trophy", "pixel-icon");
    $("#reward-kicker").textContent = item.kicker;
    $("#reward-title").textContent = item.title;
    $("#reward-text").textContent = item.text;
    const dialog = $("#reward-dialog");
    dialog.classList.remove("reward-stamp");
    void dialog.offsetWidth;
    dialog.classList.add("reward-stamp");
    dialog.showModal();
    if (item.flash) flash();
    particles(item.color || "var(--gold)", item.particles || 22);
    window.GranaAudio.play(item.sound || "conquista");
  }

  function grantXp(amount) {
    const oldLevel = state.player.level;
    state.player.xp += amount;
    state.player.level = levelFromXp(state.player.xp);
    if (state.player.level > oldLevel) {
      const gained = (state.player.level - oldLevel) * 20;
      state.player.coins += gained;
      state.player.lifetimeCoins += gained;
      enqueueReward({ kicker: "SUBIU DE NÍVEL!", title: `NV. ${oldLevel} → NV. ${state.player.level}`, text: `RECOMPENSA: +${gained} MOEDAS`, icon: "level", sound: "nivel", flash: true, particles: 34, color: "var(--red-bright)" });
    }
  }

  function claimQuest(key, title) {
    const quest = state.quests[key];
    if (!quest || quest.claimed || quest.progress < quest.target) return false;
    quest.claimed = true;
    state.stats.questsCompleted += 1;
    enqueueReward({ kicker: "MISSÃO CONCLUÍDA!", title, text: `+${quest.xp} XP${quest.coins ? ` · +${quest.coins} MOEDAS` : ""}`, icon: "scroll", sound: "missao", delay: 650 });
    state.player.coins += quest.coins;
    state.player.lifetimeCoins += quest.coins;
    grantXp(quest.xp);
    return true;
  }

  function unlockAchievement(key) {
    if (state.achievements[key]) return;
    const achievement = achievementData.find((item) => item.key === key);
    if (!achievement) return;
    state.achievements[key] = true;
    enqueueReward({ kicker: "CONQUISTA DESBLOQUEADA!", title: achievement.name, text: achievement.description.toUpperCase(), icon: achievement.icon, sound: "conquista", delay: 300 });
  }
  function checkAchievements() {
    if (state.stats.expensesLogged >= 1) unlockAchievement("firstExpense");
    if (state.player.streak >= 7) unlockAchievement("streaker");
    if (state.player.lifetimeCoins >= 100) unlockAchievement("coinHoarder");
    if (state.player.level >= 5) unlockAchievement("levelFive");
    if (state.stats.questsCompleted >= 10) unlockAchievement("questMaster");
  }

  function transactionRows(items, includeDate = false) {
    if (!items.length) return `<div class="empty-state">${icon("wallet")}<p>NENHUM GASTO REGISTRADO<br><small>Sua jornada começa no primeiro registro.</small></p></div>`;
    return `<div class="inventory-list">${items.map((item) => {
      const category = categoryMap[item.category] || categoryMap.outros;
      return `<article class="transaction-row">${icon(category.icon)}<span class="category-tag">${category.label}</span><strong>${escapeHtml(item.description)}</strong>${includeDate ? `<small>${formatDate(item.date)}</small>` : ""}<span class="amount">−${money.format(item.value)}</span><button class="delete-transaction" type="button" data-delete-transaction="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.description)}">${icon("trash")}</button></article>`;
    }).join("")}</div>`;
  }

  function renderDashboard() {
    const status = budgetStatus();
    const quest = state.quests.registrar;
    return `<div class="dashboard-grid">
      <article class="budget-card pixel-panel"><div class="card-head"><h2>${icon("wallet")} ORÇAMENTO MENSAL</h2><span class="pixel-badge" style="color:${status.color}">${status.label}</span></div>
        <div class="budget-stats"><article><small>ORÇAMENTO</small><strong>${money.format(state.budget.monthly)}</strong></article><article><small>GASTO</small><strong>${money.format(spent())}</strong></article><article><small>DISPONÍVEL</small><strong style="color:${available() < 0 ? "var(--danger)" : status.color}">${money.format(available())}</strong></article></div>
        <div class="pixel-progress ${status.cls}" style="--value:${Math.min(100,spent()/state.budget.monthly*100)}%"><span></span></div><div class="budget-caption"><span>${Math.round(spent()/state.budget.monthly*100)}% utilizado</span><b>${available() >= 0 ? "DENTRO DO LIMITE" : "LIMITE ULTRAPASSADO"}</b></div></article>
      <article class="active-quest-card pixel-card"><div class="card-head"><h2>${icon("scroll")} MISSÃO EM DESTAQUE</h2><span class="pixel-badge pixel-badge--gold">DIÁRIA 01</span></div>${icon(quest.claimed ? "check" : "target","quest-main-icon")}<h3>${quest.claimed ? "MISSÃO CONCLUÍDA" : "REGISTRAR 3 GASTOS"}</h3><div class="quest-progress-count"><span>PROGRESSO</span><strong>${quest.progress} / ${quest.target}</strong></div><div class="pixel-progress ${quest.claimed ? "pixel-progress--green" : "pixel-progress--gold"}" style="--value:${progressPercent(quest)}%"><span></span></div><div class="quest-reward">${icon("coin")} +20 XP · +5 MOEDAS</div><p class="quest-hint">${quest.claimed ? "Recompensa coletada. Volte amanhã para uma nova missão." : "Falta apenas um registro. Qualquer valor concede o mesmo XP."}</p></article>
      <article class="recent-card pixel-card"><div class="card-head"><h2>${icon("expenses")} GASTOS RECENTES</h2><button class="pixel-button pixel-button--ghost pixel-button--small" type="button" data-go-page="gastos">VER TODOS</button></div>${transactionRows(state.transactions.slice(0,3))}</article>
      <div class="loop-strip"><span>AÇÃO FINANCEIRA REAL</span><i>→</i><span>REGISTRO</span><i>→</i><span>PROGRESSO</span><i>→</i><span>MISSÃO</span><i>→</i><span><b>XP + MOEDAS</b></span><i>→</i><span>EVOLUÇÃO</span></div>
    </div>`;
  }

  function renderExpenses() {
    return `<div class="page-grid"><article class="section-panel pixel-panel all-transactions"><h2 class="section-title">INVENTÁRIO DE GASTOS <span>${state.transactions.length} ITENS · TOTAL ${money.format(spent())}</span></h2>${transactionRows(state.transactions,true)}</article><div class="form-rule">${icon("shield")} Excluir um item recalcula o orçamento, mas não desfaz XP nem permite receber novamente uma recompensa já coletada.</div></div>`;
  }

  function questCard(key, order, title, reward, action = "") {
    const quest = state.quests[key];
    const complete = quest.claimed;
    return `<article class="quest-card ${complete ? "is-complete" : ""}"><div class="quest-card__top"><small>DIÁRIA ${order}</small>${icon(complete ? "check" : "scroll")}</div><h3>${title}</h3><div class="pixel-progress ${complete ? "pixel-progress--green" : "pixel-progress--gold"}" style="--value:${progressPercent(quest)}%"><span></span></div><div class="quest-card__meta"><span>${quest.progress} / ${quest.target}</span><b>${reward}</b></div>${action && !complete ? `<button class="pixel-button pixel-button--small" type="button" data-quest-action="${action}">REVISAR AGORA</button>` : ""}</article>`;
  }
  function renderQuests() {
    return `<div class="page-grid"><div class="quest-grid">${questCard("registrar","01","REGISTRAR 3 GASTOS","+20 XP · +5 MOEDAS")}${questCard("revisar","02","REVISAR ORÇAMENTO","+10 XP","revisar")}${questCard("categorizar","03","CATEGORIZAR 5 DESPESAS","+15 XP · +3 MOEDAS")}</div><article class="weekly-card">${icon("shield")}<div><span class="pixel-kicker">MISSÃO SEMANAL</span><h3>MANTER-SE ABAIXO DO ORÇAMENTO</h3><div class="pixel-progress pixel-progress--green" style="--value:${Math.min(100,spent()/state.budget.monthly*100)}%"><span></span></div><p>Atual: ${money.format(spent())} / ${money.format(state.budget.monthly)}</p></div><div class="weekly-reward">RECOMPENSA<br>+100 XP<br>+25 MOEDAS</div></article></div>`;
  }

  function renderUpgrades() {
    return `<div class="shop-intro"><p>Moedas são virtuais e liberam apenas progressão ou cosméticos.</p><b>${icon("coin")} ${state.player.coins} MOEDAS</b></div><div class="shop-grid">${upgradeData.map((item) => {
      const owned = state.upgrades[item.key];
      const locked = state.player.level < item.level;
      const insufficient = state.player.coins < item.price;
      const label = owned ? "ADQUIRIDO" : locked ? `LIBERA NO NÍVEL ${item.level}` : insufficient ? "MOEDAS INSUFICIENTES" : "COMPRAR";
      return `<article class="shop-card ${owned ? "is-owned" : ""} ${locked ? "is-locked" : ""}">${owned ? '<span class="owned-stamp">ADQUIRIDO</span>' : ""}${icon(item.icon)}<h3>${item.name}</h3><p>${item.description}</p><span class="price">${icon("coin")} ${item.price} MOEDAS</span><button class="pixel-button ${owned ? "pixel-button--ghost" : "pixel-button--gold"}" type="button" data-buy="${item.key}" ${owned || locked || insufficient ? "disabled" : ""}>${label}</button></article>`;
    }).join("")}</div>`;
  }

  function renderAchievements() {
    const unlocked = Object.values(state.achievements).filter(Boolean).length;
    return `<div class="page-grid"><div class="shop-intro"><p>Marcos reconhecem hábitos de longo prazo.</p><b>${unlocked} / ${achievementData.length} DESBLOQUEADAS</b></div><div class="achievement-grid">${achievementData.map((item) => `<article class="achievement-card ${state.achievements[item.key] ? "is-unlocked" : ""}">${icon(state.achievements[item.key] ? item.icon : "lock")}<h3>${item.name}</h3><p>${item.description}</p><small>${state.achievements[item.key] ? "DESBLOQUEADA" : "BLOQUEADA"}</small></article>`).join("")}</div></div>`;
  }

  function renderProfile() {
    return `<div class="profile-page"><article class="profile-hero pixel-panel">${icon("user")}<h2>${escapeHtml(state.player.name).toUpperCase()}</h2><p>ORGANIZADOR FINANCEIRO · NV. ${state.player.level}</p></article><article class="profile-details pixel-panel"><h2 class="section-title">STATUS DO JOGADOR</h2><dl><div><dt>EXPERIÊNCIA TOTAL</dt><dd>${state.player.xp} XP</dd></div><div><dt>MOEDAS CONQUISTADAS</dt><dd>${state.player.lifetimeCoins}</dd></div><div><dt>SEQUÊNCIA ATUAL</dt><dd>${state.player.streak} DIAS</dd></div><div><dt>GASTOS REGISTRADOS</dt><dd>${state.stats.expensesLogged}</dd></div><div><dt>MISSÕES CONCLUÍDAS</dt><dd>${state.stats.questsCompleted}</dd></div><div><dt>CLASSE</dt><dd>JOVEM PROFISSIONAL</dd></div></dl></article></div>`;
  }

  function renderSettings() {
    const muted = window.GranaAudio.isMuted();
    return `<div class="settings-list"><article class="setting-row"><div>${icon(muted ? "mute" : "sound")}<span><h3>EFEITOS SONOROS</h3><p>Sons originais sintetizados pelo navegador.</p></span></div><button class="pixel-button pixel-button--small pixel-button--ghost" type="button" data-setting-audio>${muted ? "ATIVAR" : "SILENCIAR"}</button></article><article class="setting-row"><div>${icon("shield")}<span><h3>GAMIFICAÇÃO ÉTICA</h3><p>O aplicativo recompensa consistência, consciência e metas — nunca o valor gasto.</p></span></div><span class="pixel-badge pixel-badge--green">ATIVA</span></article><article class="setting-row setting-row--danger"><div>${icon("retry")}<span><h3>REINICIAR DEMO</h3><p>Volta ao estado ideal da apresentação.</p></span></div><button class="pixel-button pixel-button--small" type="button" data-reset-demo>REINICIAR</button></article><article class="setting-row"><div>${icon("arrow")}<span><h3>VOLTAR À APRESENTAÇÃO</h3><p>Retorna aos slides do MVP.</p></span></div><a class="pixel-button pixel-button--small pixel-button--ghost" href="slides.html">ABRIR SLIDES</a></article></div>`;
  }

  function renderPage() {
    const renderers = { painel: renderDashboard, gastos: renderExpenses, missoes: renderQuests, melhorias: renderUpgrades, conquistas: renderAchievements, perfil: renderProfile, configuracoes: renderSettings };
    $("#page-kicker").textContent = pages[currentPage][0];
    $("#page-title").textContent = pages[currentPage][1];
    $("#page-content").innerHTML = renderers[currentPage]();
    $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.page === currentPage));
    window.GranaIcons.hydrate($("#page-content"));
    updateHud();
  }

  function updateHud() {
    $("#hud-player").textContent = state.player.name.toUpperCase();
    $("#hud-level").textContent = String(state.player.level).padStart(2,"0");
    $("#hud-xp").textContent = `${state.player.xp} / ${nextThreshold(state.player.level)}`;
    $("#hud-xp-bar").style.setProperty("--value", `${xpPercent()}%`);
    $("#hud-coins").textContent = state.player.coins;
    $("#hud-streak").textContent = `${state.player.streak} DIAS`;
    $("#boot-level").textContent = String(state.player.level).padStart(2,"0");
    $("#boot-coins").textContent = state.player.coins;
    $("#boot-streak").textContent = `${state.player.streak} DIAS`;
    const openQuests = Object.values(state.quests).filter((quest) => quest.target && !quest.claimed).length;
    $("#nav-quest-count").textContent = openQuests;
    $("#nav-quest-count").hidden = openQuests === 0;
    document.body.classList.toggle("theme-red-hud", state.upgrades.redHud);
    document.body.classList.toggle("theme-golden-wallet", state.upgrades.goldenWallet);
    document.body.classList.toggle("theme-wizard", state.preferences.wizardTheme);
    const audioButton = $("#demo-audio");
    audioButton.innerHTML = icon(window.GranaAudio.isMuted() ? "mute" : "sound");
  }

  function navigate(page) {
    if (!pages[page]) return;
    currentPage = page;
    renderPage();
    $("#game-nav").classList.remove("is-open");
    $("#main-content").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addExpense(data) {
    const value = Number(data.value);
    if (!Number.isFinite(value) || value <= 0) throw new Error("Informe um valor válido.");
    if (!categoryMap[data.category]) throw new Error("Escolha uma categoria válida.");
    const description = String(data.description || "").trim();
    if (!description) throw new Error("Escreva uma descrição.");
    state.transactions.unshift({ id: `gasto-${Date.now()}-${Math.floor(Math.random()*1000)}`, value: Math.round(value * 100) / 100, category: data.category, description: description.slice(0,42), date: data.date || window.GranaStorage.today() });
    state.stats.expensesLogged += 1;
    const canEarnLogXp = state.dailyXpLogs < 3;
    if (canEarnLogXp) {
      state.dailyXpLogs += 1;
      state.quests.registrar.progress = Math.min(state.quests.registrar.target, state.quests.registrar.progress + 1);
      grantXp(5);
      floatXp(5);
    }
    state.quests.categorizar.progress = Math.min(state.quests.categorizar.target, state.quests.categorizar.progress + 1);
    claimQuest("registrar", "REGISTRAR 3 GASTOS");
    claimQuest("categorizar", "CATEGORIZAR 5 DESPESAS");
    checkAchievements();
    persist();
    renderPage();
    window.GranaAudio.play("moeda");
    toast("GASTO REGISTRADO", `${description} · ${money.format(value)}${canEarnLogXp ? " · +5 XP" : ""}`);
    return { transaction: state.transactions[0], xpAwarded: canEarnLogXp ? 5 : 0, spent: spent(), available: available() };
  }

  function deleteTransaction(id) {
    const index = state.transactions.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [removed] = state.transactions.splice(index,1);
    persist();
    renderPage();
    toast("ITEM REMOVIDO", `${removed.description} saiu do orçamento. Nenhum XP foi alterado.`);
    window.GranaAudio.play("voltar");
  }

  function reviewBudget() {
    const quest = state.quests.revisar;
    if (quest.claimed) return;
    quest.progress = 1;
    claimQuest("revisar", "REVISAR ORÇAMENTO");
    checkAchievements();
    persist();
    renderPage();
  }

  function buyUpgrade(key) {
    const item = upgradeData.find((upgrade) => upgrade.key === key);
    if (!item || state.upgrades[key] || state.player.level < item.level || state.player.coins < item.price) { window.GranaAudio.play("erro"); return; }
    state.player.coins -= item.price;
    state.upgrades[key] = true;
    persist();
    renderPage();
    window.GranaAudio.play("compra");
    particles("var(--gold)",18);
    toast("MELHORIA ADQUIRIDA", item.name);
  }

  function openGame(mode) {
    if (mode === "fresh") state = window.GranaStorage.reset("fresh");
    $("#game-shell").hidden = false;
    $("#boot-screen").classList.add("is-leaving");
    setTimeout(() => { $("#boot-screen").hidden = true; }, 480);
    renderPage();
    window.GranaAudio.play("confirmar");
  }

  function resetDemo() {
    state = window.GranaStorage.reset("ideal");
    rewardQueue = [];
    rewardShowing = false;
    $("#reset-dialog").close();
    currentPage = "painel";
    renderPage();
    toast("DEMO REINICIADA", "O momento ideal da apresentação foi restaurado.");
    window.GranaAudio.play("confirmar");
  }

  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const report = (error) => console.warn("Ferramenta do navegador indisponível:", error);
    try {
      Promise.resolve(context.registerTool({ name: "registrar_gasto", title: "Registrar gasto no GranaXP", description: "Registra um gasto, atualiza o orçamento e aplica a progressão diária do jogo.", inputSchema: { type: "object", properties: { valor: { type: "number", exclusiveMinimum: 0 }, categoria: { type: "string", enum: Object.keys(categoryMap) }, descricao: { type: "string", minLength: 1, maxLength: 42 }, data: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } }, required: ["valor","categoria","descricao"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { const result = addExpense({ value: input.valor, category: input.categoria, description: input.descricao, date: input.data }); return { status: "registrado", valor: result.transaction.value, gastoTotal: result.spent, saldoDisponivel: result.available, xpRecebido: result.xpAwarded }; } })).catch(report);
      Promise.resolve(context.registerTool({ name: "consultar_resumo_financeiro", title: "Consultar resumo do GranaXP", description: "Retorna orçamento, gastos, saldo e progressão atuais sem alterar dados.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute() { return { orcamento: state.budget.monthly, gasto: spent(), disponivel: available(), nivel: state.player.level, xp: state.player.xp, moedas: state.player.coins }; } })).catch(report);
    } catch (error) { report(error); }
  }

  function setupEvents() {
    $("#continue-game").addEventListener("click", () => openGame("continue"));
    $("#new-game").addEventListener("click", () => openGame("fresh"));
    $("#open-expense").addEventListener("click", () => { $("#expense-form").reset(); $("#expense-date").value = window.GranaStorage.today(); $("#expense-dialog").showModal(); setTimeout(() => $("#expense-value").focus(),50); });
    $("#expense-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try { addExpense(Object.fromEntries(form.entries())); $("#expense-dialog").close(); }
      catch (error) { toast("NÃO FOI POSSÍVEL", error.message); window.GranaAudio.play("erro"); }
    });
    $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
    $("#reward-continue").addEventListener("click", () => { $("#reward-dialog").close(); setTimeout(showNextReward,220); });
    $("#confirm-reset").addEventListener("click", resetDemo);
    $("#demo-audio").addEventListener("click", () => { window.GranaAudio.toggle(); updateHud(); if (currentPage === "configuracoes") renderPage(); });
    $("#mobile-menu").addEventListener("click", () => $("#game-nav").classList.toggle("is-open"));
    $("#game-nav").addEventListener("click", (event) => { const button = event.target.closest("[data-page]"); if (button) navigate(button.dataset.page); });
    $("#page-content").addEventListener("click", (event) => {
      const page = event.target.closest("[data-go-page]"); if (page) navigate(page.dataset.goPage);
      const remove = event.target.closest("[data-delete-transaction]"); if (remove) deleteTransaction(remove.dataset.deleteTransaction);
      const quest = event.target.closest("[data-quest-action]"); if (quest?.dataset.questAction === "revisar") reviewBudget();
      const buy = event.target.closest("[data-buy]"); if (buy) buyUpgrade(buy.dataset.buy);
      if (event.target.closest("[data-setting-audio]")) { window.GranaAudio.toggle(); renderPage(); }
      if (event.target.closest("[data-reset-demo]")) $("#reset-dialog").showModal();
    });
    document.addEventListener("granaxp:saved", savedPulse);
    document.addEventListener("granaxp:audio", updateHud);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !$("#boot-screen").hidden && !$("#boot-screen").classList.contains("is-leaving")) openGame("continue");
      if (event.key === "Escape") $("#game-nav").classList.remove("is-open");
      handleKonami(event.key);
    });
    $("#boot-title").addEventListener("click", () => { logoClicks += 1; if (logoClicks === 7) { state.preferences.wizardTheme = true; persist(); toast("MODO MAGO FINANCEIRO", "Tema cosmético secreto desbloqueado."); particles("var(--blue)",30); } });
  }

  const konami = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let konamiIndex = 0;
  function handleKonami(key) {
    if (key === konami[konamiIndex]) konamiIndex += 1;
    else konamiIndex = key === konami[0] ? 1 : 0;
    if (konamiIndex === konami.length) {
      state.preferences.wizardTheme = !state.preferences.wizardTheme;
      persist(); updateHud(); particles("var(--blue)",30); toast("CÓDIGO SECRETO ACEITO", "Tema cosmético alternativo ativado."); konamiIndex = 0;
    }
  }

  if (new URLSearchParams(location.search).get("reset") === "1") state = window.GranaStorage.reset("ideal");
  $("#today-label").textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date()).toUpperCase();
  setupEvents();
  updateHud();
  registerWebMcp();
})();
