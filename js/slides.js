(function () {
  "use strict";

  const slides = [...document.querySelectorAll(".slide")];
  const counter = document.getElementById("slide-counter");
  const hudText = document.getElementById("hud-progress-text");
  const hudFill = document.getElementById("hud-progress-fill");
  const overview = document.getElementById("overview");
  const overviewGrid = document.getElementById("overview-grid");
  const exportMenu = document.getElementById("export-menu");
  const helpDialog = document.getElementById("help-dialog");
  const audioButton = document.getElementById("audio-toggle");
  let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.replace("#slide-", "")) - 1 || 0));
  let changing = false;

  function updateAudioIcon() {
    if (!audioButton) return;
    audioButton.innerHTML = window.GranaIcons.icon(window.GranaAudio.isMuted() ? "mute" : "sound");
    audioButton.setAttribute("aria-label", window.GranaAudio.isMuted() ? "Ativar sons" : "Silenciar sons");
  }

  function commitSlide(next) {
    slides[current].classList.remove("is-active");
    slides[current].setAttribute("aria-hidden", "true");
    current = next;
    slides[current].classList.add("is-active");
    slides[current].removeAttribute("aria-hidden");
    const shown = current + 1;
    counter.textContent = `${String(shown).padStart(2, "0")} / ${slides.length}`;
    hudText.textContent = `${shown} / ${slides.length}`;
    hudFill.style.width = `${shown / slides.length * 100}%`;
    history.replaceState(null, "", `#slide-${shown}`);
    document.title = `GranaXP — ${slides[current].querySelector("h1,h2")?.textContent.trim() || "Apresentação"}`;
    updateOverviewCurrent();
  }

  async function goTo(index, immediate = false) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    if (next === current || changing) return;
    changing = true;
    const type = slides[next].dataset.transition;
    if (immediate) commitSlide(next);
    else await window.PixelTransition.run(type, () => commitSlide(next));
    changing = false;
  }

  function next() { goTo(current + 1); }
  function previous() { goTo(current - 1); }

  function buildOverview() {
    overviewGrid.innerHTML = slides.map((slide, index) => {
      const title = slide.querySelector("h1,h2")?.textContent.trim() || `Slide ${index + 1}`;
      return `<button class="overview-thumb" type="button" data-overview-slide="${index}"><span class="overview-mini"><b>${title}</b></span><span class="overview-thumb__label">${String(index + 1).padStart(2,"0")} · ${title}</span></button>`;
    }).join("");
    overviewGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-overview-slide]");
      if (!button) return;
      closeOverview();
      goTo(Number(button.dataset.overviewSlide), true);
    });
    updateOverviewCurrent();
  }

  function updateOverviewCurrent() {
    overviewGrid?.querySelectorAll(".overview-thumb").forEach((thumb, index) => thumb.classList.toggle("is-current", index === current));
  }

  function openOverview() { overview.hidden = false; exportMenu.hidden = true; updateOverviewCurrent(); overview.querySelector(".is-current")?.focus(); }
  function closeOverview() { overview.hidden = true; }
  function toggleOverview() { overview.hidden ? openOverview() : closeOverview(); }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function toggleHelp() { helpDialog.open ? helpDialog.close() : helpDialog.showModal(); }
  function toggleExport() { exportMenu.hidden = !exportMenu.hidden; }

  document.getElementById("next-slide").addEventListener("click", next);
  document.getElementById("prev-slide").addEventListener("click", previous);
  document.getElementById("overview-toggle").addEventListener("click", toggleOverview);
  document.getElementById("fullscreen-toggle").addEventListener("click", toggleFullscreen);
  document.getElementById("export-toggle").addEventListener("click", toggleExport);
  document.getElementById("help-toggle").addEventListener("click", toggleHelp);
  document.querySelector("[data-close-overview]").addEventListener("click", closeOverview);
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelectorAll("[data-next-slide]").forEach((button) => button.addEventListener("click", next));
  audioButton.addEventListener("click", () => { window.GranaAudio.toggle(); updateAudioIcon(); });
  document.addEventListener("granaxp:audio", updateAudioIcon);

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#export-menu,#export-toggle")) exportMenu.hidden = true;
  });

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (["INPUT","SELECT","TEXTAREA"].includes(tag)) return;
    if (event.key === "Escape") {
      if (helpDialog.open) helpDialog.close();
      else toggleOverview();
      return;
    }
    if (!overview.hidden) return;
    const key = event.key.toLowerCase();
    if (["arrowright","arrowdown","pagedown"," "].includes(key)) { event.preventDefault(); next(); }
    if (["arrowleft","arrowup","pageup"].includes(key)) { event.preventDefault(); previous(); }
    if (key === "home") { event.preventDefault(); goTo(0); }
    if (key === "end") { event.preventDefault(); goTo(slides.length - 1); }
    if (key === "f") toggleFullscreen();
    if (key === "m") { window.GranaAudio.toggle(); updateAudioIcon(); }
    if (key === "d") location.href = "demo.html";
    if (key === "e") toggleExport();
    if (key === "h" || key === "?") toggleHelp();
  });

  slides.forEach((slide, index) => {
    if (index !== current) { slide.classList.remove("is-active"); slide.setAttribute("aria-hidden", "true"); }
  });
  buildOverview();
  commitSlide(current);
  updateAudioIcon();

  window.GranaSlides = { goTo, currentIndex: () => current, slides };
})();
