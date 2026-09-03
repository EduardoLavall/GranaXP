(function () {
  "use strict";

  const STORAGE_KEY = "granaxp_audio_muted";
  let context = null;
  let muted = localStorage.getItem(STORAGE_KEY) === "1";
  let ready = false;

  const patterns = {
    navegar: [{ f: 220, d: .035, t: "square", v: .025 }],
    confirmar: [{ f: 330, d: .05 }, { f: 494, d: .07, delay: .045 }],
    voltar: [{ f: 330, d: .045 }, { f: 220, d: .07, delay: .035 }],
    moeda: [{ f: 659, d: .05 }, { f: 988, d: .1, delay: .045 }],
    missao: [{ f: 392, d: .06 }, { f: 523, d: .06, delay: .06 }, { f: 784, d: .15, delay: .12 }],
    nivel: [{ f: 262, d: .08 }, { f: 330, d: .08, delay: .08 }, { f: 392, d: .08, delay: .16 }, { f: 523, d: .22, delay: .24 }],
    conquista: [{ f: 523, d: .07 }, { f: 659, d: .07, delay: .07 }, { f: 784, d: .18, delay: .14 }],
    compra: [{ f: 740, d: .04 }, { f: 554, d: .08, delay: .05 }, { f: 880, d: .11, delay: .12 }],
    erro: [{ f: 150, d: .11, t: "square", v: .04 }, { f: 110, d: .13, delay: .08, t: "square", v: .035 }],
    transicao: [{ f: 180, d: .035, t: "triangle", v: .02 }, { f: 260, d: .045, delay: .035, t: "triangle", v: .018 }]
  };

  function ensure() {
    if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === "suspended") context.resume();
    ready = true;
    return context;
  }

  function tone({ f, d, delay = 0, t = "square", v = .03 }) {
    if (muted || !ready) return;
    const ctx = ensure();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t;
    osc.frequency.setValueAtTime(f, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(v, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + d);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + d + .015);
  }

  function play(name) {
    if (muted || !ready) return;
    (patterns[name] || patterns.navegar).forEach(tone);
  }

  function setMuted(value) {
    muted = Boolean(value);
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    document.dispatchEvent(new CustomEvent("granaxp:audio", { detail: { muted } }));
    if (!muted) { ensure(); play("confirmar"); }
    return muted;
  }

  function toggle() { return setMuted(!muted); }

  function activate() { if (!muted) ensure(); }

  document.addEventListener("pointerdown", activate, { once: true });
  document.addEventListener("keydown", activate, { once: true });
  document.addEventListener("click", (event) => {
    if (event.target.closest("button, [role='button'], a")) play("navegar");
  });

  window.GranaAudio = { play, toggle, setMuted, activate, isMuted: () => muted };
})();
