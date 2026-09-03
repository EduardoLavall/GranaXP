(function () {
  "use strict";

  const overlay = document.getElementById("export-overlay");
  const status = document.getElementById("export-status");
  const count = document.getElementById("export-count");
  const progress = overlay?.querySelector(".pixel-progress");
  let exporting = false;

  function setProgress(label, current, total) {
    status.textContent = label;
    count.textContent = `${current} / ${total}`;
    progress.style.setProperty("--value", `${current / total * 100}%`);
  }

  function show() { overlay.hidden = false; document.body.classList.add("exporting"); }
  function hide() { setTimeout(() => { overlay.hidden = true; document.body.classList.remove("exporting"); }, 850); }

  async function captureSlides() {
    if (!window.html2canvas) throw new Error("Biblioteca de captura não encontrada.");
    const slides = window.GranaSlides.slides;
    const active = window.GranaSlides.currentIndex();
    const canvases = [];
    const stage = document.querySelector(".presentation-stage");
    const scale = Math.max(1, Math.min(2, 1920 / stage.clientWidth));
    for (let index = 0; index < slides.length; index += 1) {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
        slide.classList.toggle("is-capturing", slideIndex === index);
      });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = await window.html2canvas(slides[index], { backgroundColor: "#090909", scale, useCORS: true, logging: false, width: stage.clientWidth, height: stage.clientHeight });
      canvases.push(canvas);
      setProgress("CAPTURANDO SLIDES", index + 1, slides.length);
    }
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === active);
      slide.classList.remove("is-capturing");
    });
    return canvases;
  }

  async function exportPdf() {
    const JsPdf = window.jspdf?.jsPDF;
    if (!JsPdf) throw new Error("Biblioteca de PDF não encontrada.");
    show();
    const canvases = await captureSlides();
    const pdf = new JsPdf({ orientation: "landscape", unit: "px", format: [1920,1080], compress: true, hotfixes: ["px_scaling"] });
    canvases.forEach((canvas, index) => {
      if (index) pdf.addPage([1920,1080], "landscape");
      pdf.addImage(canvas.toDataURL("image/jpeg", .94), "JPEG", 0, 0, 1920, 1080, undefined, "FAST");
      setProgress("MONTANDO PDF", index + 1, canvases.length);
    });
    pdf.save("GranaXP-MVP.pdf");
    setProgress("PDF PRONTO", canvases.length, canvases.length);
    hide();
  }

  async function exportPptx() {
    const Pptx = window.PptxGenJS || window.pptxgen;
    if (!Pptx) throw new Error("Biblioteca de PowerPoint não encontrada.");
    show();
    const canvases = await captureSlides();
    const pptx = new Pptx();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "GranaXP";
    pptx.subject = "Apresentação do MVP GranaXP";
    pptx.title = "GranaXP — MVP";
    pptx.company = "GranaXP";
    pptx.lang = "pt-BR";
    canvases.forEach((canvas, index) => {
      const slide = pptx.addSlide();
      slide.background = { color: "090909" };
      slide.addImage({ data: canvas.toDataURL("image/png"), x: 0, y: 0, w: 13.333, h: 7.5 });
      setProgress("MONTANDO POWERPOINT", index + 1, canvases.length);
    });
    await pptx.writeFile({ fileName: "GranaXP-MVP.pptx" });
    setProgress("POWERPOINT PRONTO", canvases.length, canvases.length);
    hide();
  }

  async function run(type) {
    if (exporting) return;
    exporting = true;
    try {
      if (type === "pdf") await exportPdf();
      else if (type === "pptx") await exportPptx();
      else window.print();
      window.GranaAudio?.play("confirmar");
    } catch (error) {
      console.error(error);
      show();
      status.textContent = "NÃO FOI POSSÍVEL EXPORTAR";
      count.textContent = error.message;
      progress.style.setProperty("--value", "0%");
      window.GranaAudio?.play("erro");
      hide();
    } finally { exporting = false; }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-export]");
    if (button) run(button.dataset.export);
  });
  window.GranaExport = { run };
})();
