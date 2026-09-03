(function () {
  "use strict";

  const shapes = {
    coin: '<circle cx="12" cy="12" r="8" fill="currentColor"/><path d="M8 8h8v2h-4v1h4v5H8v-2h4v-1H8z" fill="#090909"/>',
    wallet: '<path d="M3 5h15v3h3v11H3z" fill="currentColor"/><path d="M5 8h13V7H5zm9 4h5v4h-5z" fill="#090909"/><path d="M15 13h2v2h-2z" fill="#fff1d0"/>',
    sword: '<path d="M15 2h6v6L9 20l-5-5z" fill="currentColor"/><path d="M14 7l3-3h2v2l-3 3zM4 18l2-2 2 2-2 3H3z" fill="#090909"/>',
    shield: '<path d="M4 3h16v9c0 5-4 8-8 10-4-2-8-5-8-10z" fill="currentColor"/><path d="M8 7h8v6c0 2-2 4-4 5-2-1-4-3-4-5z" fill="#090909"/>',
    scroll: '<path d="M5 3h14v18H5z" fill="currentColor"/><path d="M3 3h4v4H3zm14 14h4v4h-4zM9 8h6v2H9zm0 4h6v2H9z" fill="#090909"/>',
    check: '<path d="M3 11h4v4h3v3h4v-4h3v-4h4V6h-5v4h-3v4h-2v-3H7V8H3z" fill="currentColor"/>',
    lock: '<path d="M6 10V6h2V3h8v3h2v4h3v11H3V10zm4 0h4V7h-4zm1 4h2v4h-2z" fill="currentColor"/>',
    star: '<path d="M10 2h4v5h5v4h3v4h-7v6H9v-6H2v-4h3V7h5z" fill="currentColor"/>',
    trophy: '<path d="M6 3h12v3h4v8h-4v3h-4v2h4v3H6v-3h4v-2H6v-3H2V6h4zm-1 6v3h2V9zm12 0v3h2V9z" fill="currentColor"/>',
    flame: '<path d="M12 2h3v5h3v4h3v6h-3v3H6v-3H3v-6h3V7h3v4h3z" fill="currentColor"/><path d="M10 13h4v5h-4z" fill="#090909"/>',
    heart: '<path d="M3 5h7v3h4V5h7v10h-3v3h-3v3H9v-3H6v-3H3z" fill="currentColor"/>',
    lightning: '<path d="M12 2h7l-4 7h5L9 22v-9H4z" fill="currentColor"/>',
    level: '<path d="M4 17h4v-4h4V9h4V5h4v16H4zM4 3h8v3H4z" fill="currentColor"/>',
    graph: '<path d="M3 3h3v15h15v3H3zM8 13h3v3H8zm4-5h3v8h-3zm4 2h3v6h-3z" fill="currentColor"/>',
    bag: '<path d="M8 2h8l-2 4h4l3 6v9H3v-9l3-6h4z" fill="currentColor"/><path d="M9 10h6v2h-2v1h2v4H9v-2h3v-1H9z" fill="#090909"/>',
    target: '<path d="M7 2h10v3h4v4h3v6h-3v4h-4v3H7v-3H3v-4H0V9h3V5h4z" fill="currentColor"/><path d="M9 7h6v3h3v4h-3v3H9v-3H6v-4h3zm2 3v4h2v-4z" fill="#090909"/>',
    calendar: '<path d="M3 5h18v16H3z" fill="currentColor"/><path d="M6 2h3v5H6zm9 0h3v5h-3zM6 10h3v3H6zm5 0h3v3h-3zm5 0h3v3h-3zM6 15h3v3H6zm5 0h3v3h-3z" fill="#090909"/>',
    skull: '<path d="M6 3h12v3h3v10h-3v5h-4v-4h-4v4H6v-5H3V6h3z" fill="currentColor"/><path d="M7 9h4v4H7zm6 0h4v4h-4zm-3 6h4v2h-4z" fill="#090909"/>',
    crown: '<path d="M3 5h3l3 5 3-7 3 7 3-5h3l-2 14H5z" fill="currentColor"/><path d="M7 15h10v2H7z" fill="#090909"/>',
    chest: '<path d="M3 5h18v16H3z" fill="currentColor"/><path d="M3 11h18v3H3zm8 1h3v5h-3zM6 7h12v2H6z" fill="#090909"/>',
    potion: '<path d="M8 2h8v4h-2v3h4v4h3v8H3v-8h3V9h4V6H8z" fill="currentColor"/><path d="M7 14h10v4H7z" fill="#090909"/>',
    arrow: '<path d="M3 10h11V5l8 7-8 7v-5H3z" fill="currentColor"/>',
    chevron: '<path d="M6 3h5v4h4v4h4v4h-4v4h-4v3H6v-4h4v-4h4v-4h-4V7H6z" fill="currentColor"/>',
    settings: '<path d="M9 2h6l1 4 4-1 2 5-3 2 3 3-2 5-4-1-1 4H9l-1-4-4 1-2-5 3-3-3-2 2-5 4 1z" fill="currentColor"/><path d="M9 9h6v6H9z" fill="#090909"/>',
    sound: '<path d="M3 9h5l5-5v16l-5-5H3zM16 8h2v8h-2zm3-3h2v14h-2z" fill="currentColor"/>',
    mute: '<path d="M3 9h5l5-5v16l-5-5H3zM16 8h3v3h3v3h-3v3h-3v-3h-3v-3h3z" fill="currentColor"/>',
    play: '<path d="M5 3h5v3h4v3h4v3h3v3h-3v3h-4v3H5z" fill="currentColor"/>',
    export: '<path d="M3 12h4v6h10v-6h4v10H3zM10 2h4v8h4l-6 6-6-6h4z" fill="currentColor"/>',
    user: '<path d="M8 2h8v3h3v7h-3v3h3v2h3v5H4v-5h3v-2h1V12H5V5h3z" fill="currentColor"/>',
    shop: '<path d="M4 3h16l2 6v4h-3v9H5v-9H2V9zm4 10v6h8v-6z" fill="currentColor"/>',
    upgrade: '<path d="M10 2h4v7h7v4h-7v9h-4v-9H3V9h7z" fill="currentColor"/>',
    trash: '<path d="M7 2h10v3h4v3H3V5h4zm-2 8h14l-1 12H6z" fill="currentColor"/>',
    food: '<path d="M3 2h3v8h2V2h3v8h2V2h3v10h-4v10H8V12H3zM18 2h3v20h-4V9z" fill="currentColor"/>',
    transport: '<path d="M5 3h14l3 8v8h-3v3h-4v-3H9v3H5v-3H2v-8zm2 3-2 6h14l-2-6zm0 8h3v3H7zm7 0h3v3h-3z" fill="currentColor"/>',
    bills: '<path d="M4 2h16v20l-4-3-4 3-4-3-4 3z" fill="currentColor"/><path d="M8 7h8v2H8zm0 4h8v2H8z" fill="#090909"/>',
    health: '<path d="M8 2h8v6h6v8h-6v6H8v-6H2V8h6z" fill="currentColor"/>',
    education: '<path d="M2 7l10-5 10 5-10 5zm4 4 6 3 6-3v7l-6 4-6-4z" fill="currentColor"/>',
    spark: '<path d="M10 2h4v7h7v4h-7v9h-4v-9H3V9h7z" fill="currentColor"/>',
    eye: '<path d="M2 10l5-5h10l5 5v4l-5 5H7l-5-5z" fill="currentColor"/><path d="M9 8h6v8H9z" fill="#090909"/><path d="M11 10h2v3h-2z" fill="#fff1d0"/>',
    retry: '<path d="M5 5h10V2l7 6-7 6v-4H8v8h10v-4h4v8H4V10H1z" fill="currentColor"/>'
  };

  const aliases = {
    flame2: "flame", quest: "scroll", money: "bag", profile: "user",
    expenses: "wallet", achievements: "trophy", dashboard: "graph",
    entertainment: "star", other: "chest", back: "arrow"
  };

  function icon(name, className = "pixel-icon", label = "") {
    const key = shapes[name] ? name : aliases[name] || "star";
    const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
    return `<svg class="${className}" viewBox="0 0 24 24" shape-rendering="crispEdges" ${aria}>${shapes[key]}</svg>`;
  }

  function hydrate(root = document) {
    root.querySelectorAll("[data-icon]").forEach((node) => {
      node.innerHTML = icon(node.dataset.icon, node.dataset.iconClass || "pixel-icon", node.dataset.iconLabel || "");
    });
  }

  window.GranaIcons = { icon, hydrate, names: Object.keys(shapes) };
  document.addEventListener("DOMContentLoaded", () => hydrate());
})();
