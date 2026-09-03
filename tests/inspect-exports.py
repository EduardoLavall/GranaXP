from pathlib import Path
from zipfile import ZipFile

from pypdf import PdfReader


root = Path(__file__).resolve().parents[1]
pdf_path = root / "tests" / "downloads" / "GranaXP-MVP.pdf"
pptx_path = root / "tests" / "downloads" / "GranaXP-MVP.pptx"
output = root / "tests" / "artifacts" / "pdf"
output.mkdir(parents=True, exist_ok=True)

reader = PdfReader(pdf_path)
extracted = 0
try:
    for page_number in (1, 13):
        image = reader.pages[page_number - 1].images[0]
        suffix = Path(image.name).suffix or ".png"
        (output / f"pagina-{page_number:02d}{suffix}").write_bytes(image.data)
        extracted += 1
except ImportError:
    pass

with ZipFile(pptx_path) as archive:
    names = archive.namelist()
    slides = [name for name in names if name.startswith("ppt/slides/slide") and name.endswith(".xml")]
    images = [name for name in names if name.startswith("ppt/media/image") and name.endswith(".png")]

print(f"PAGINAS_PDF {len(reader.pages)}")
print(f"TAMANHO_PDF {float(reader.pages[0].mediabox.width)}x{float(reader.pages[0].mediabox.height)}")
print(f"IMAGENS_PDF_EXTRAIDAS {extracted}")
print(f"SLIDES_PPTX {len(slides)}")
print(f"IMAGENS_PPTX {len(images)}")
