(function () {
  "use strict";

  async function start() {
    try {
      if (window.GranaStorage?.hydrateRemote) await window.GranaStorage.hydrateRemote();
    } catch (error) {
      console.warn("Remote hydration skipped; continuing with local state.", error);
    }

    const script = document.createElement("script");
    script.src = "js/demo.js";
    script.defer = true;
    script.onerror = () => console.error("Could not load demo.js");
    document.head.appendChild(script);
  }

  start();
})();
