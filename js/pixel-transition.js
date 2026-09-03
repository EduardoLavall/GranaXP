(function () {
  "use strict";

  const layer = () => document.getElementById("transition-layer");
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function clear() { if (layer()) layer().innerHTML = ""; }

  async function pixelWipe(switchSlide) {
    const host = layer();
    const cols = 12;
    const rows = 7;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const block = document.createElement("i");
        block.className = `transition-block ${(x + y) % 5 === 0 ? "red" : ""}`;
        Object.assign(block.style, {
          left: `${x * 100 / cols}%`, top: `${y * 100 / rows}%`,
          width: `${100 / cols + .2}%`, height: `${100 / rows + .2}%`, opacity: "0"
        });
        host.appendChild(block);
        block.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, delay: (x + y) * 13, fill: "forwards", easing: "steps(2,end)" });
      }
    }
    await pause(300);
    switchSlide();
    [...host.children].forEach((block, index) => block.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, delay: index % cols * 8, fill: "forwards", easing: "steps(2,end)" }));
    await pause(300);
  }

  async function checkerboard(switchSlide) {
    const host = layer();
    const size = 10;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const block = document.createElement("i");
        block.className = `transition-block ${(x + y) % 2 ? "red" : ""}`;
        Object.assign(block.style, { left: `${x * 6.25}%`, top: `${y * 10}%`, width: "6.3%", height: "10.1%", opacity: "0" });
        host.appendChild(block);
        block.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: ((x + y) % 2) * 110 + Math.floor(x / 2) * 8, fill: "forwards", easing: "steps(1,end)" });
      }
    }
    await pause(280);
    switchSlide();
    [...host.children].forEach((block, index) => block.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, delay: (index % 2) * 80, fill: "forwards", easing: "steps(1,end)" }));
    await pause(240);
  }

  async function curtain(switchSlide) {
    const host = layer();
    const bars = 10;
    for (let i = 0; i < bars; i += 1) {
      const bar = document.createElement("i");
      bar.className = "transition-bar";
      Object.assign(bar.style, { top: `${i * 10}%`, height: "10.2%", transform: `scaleX(0)`, transformOrigin: i % 2 ? "right" : "left" });
      host.appendChild(bar);
      bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 230, delay: i * 14, fill: "forwards", easing: "steps(6,end)" });
    }
    await pause(360);
    switchSlide();
    [...host.children].forEach((bar, i) => bar.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: 220, delay: (bars - i) * 12, fill: "forwards", easing: "steps(6,end)" }));
    await pause(360);
  }

  async function glitch(switchSlide) {
    const host = layer();
    for (let i = 0; i < 22; i += 1) {
      const block = document.createElement("i");
      block.className = "transition-glitch";
      Object.assign(block.style, { left: `${Math.random() * 85}%`, top: `${Math.random() * 95}%`, width: `${8 + Math.random() * 25}%`, height: `${1 + Math.random() * 5}%`, opacity: "0" });
      host.appendChild(block);
      block.animate([{ opacity: 0, transform: "translateX(-30px)" }, { opacity: .8, transform: "translateX(20px)" }, { opacity: 0, transform: "translateX(0)" }], { duration: 220, delay: Math.random() * 130, fill: "forwards", easing: "steps(3,end)" });
    }
    document.getElementById("deck")?.classList.add("shake");
    await pause(180);
    switchSlide();
    await pause(250);
    document.getElementById("deck")?.classList.remove("shake");
  }

  async function run(type, switchSlide) {
    if (reduceMotion()) { switchSlide(); return; }
    const transition = { pixel: pixelWipe, checker: checkerboard, curtain, glitch }[type] || pixelWipe;
    clear();
    window.GranaAudio?.play("transicao");
    await transition(switchSlide);
    clear();
  }

  window.PixelTransition = { run, clear };
})();
