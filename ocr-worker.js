const { parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

parentPort.on('message', async (msg) => {
  const { docId, filePath } = msg;
  try {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    const exists = await fsp.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      parentPort.postMessage({ docId, error: 'file_not_found' });
      return;
    }

    const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];

    if (ext === '.pdf') {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const buf = new Uint8Array(await fsp.readFile(filePath));
      const pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
      let pdfText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const tc = await page.getTextContent();
        pdfText += tc.items.map(item => item.str).join(' ') + '\n';
        page.cleanup();
      }
      pdfDoc.cleanup();

      if (pdfText.trim().length > 50) {
        text = pdfText.trim();
      } else {
        const { createCanvas } = require('canvas');
        const pdfDoc2 = await pdfjsLib.getDocument({ data: buf }).promise;
        let ocrText = '';
        for (let i = 1; i <= pdfDoc2.numPages; i++) {
          const page = await pdfDoc2.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const cvs = createCanvas(viewport.width, viewport.height);
          const ctx = cvs.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          const pngBuf = cvs.toBuffer('image/png');
          page.cleanup();
          const Tesseract = require('tesseract.js');
          const worker = await Tesseract.createWorker('ara+fra');
          const { data } = await worker.recognize(pngBuf);
          await worker.terminate();
          ocrText += (data.text || '') + '\n';
          parentPort.postMessage({ docId, type: 'progress', page: i, total: pdfDoc2.numPages });
        }
        pdfDoc2.cleanup();
        text = ocrText.trim();
      }
    } else if (imgExts.includes(ext)) {
      const Tesseract = require('tesseract.js');
      const worker = await Tesseract.createWorker('ara+fra');
      const { data } = await worker.recognize(filePath);
      await worker.terminate();
      text = data.text || '';
    }

    parentPort.postMessage({ docId, text, type: 'result' });
  } catch (e) {
    parentPort.postMessage({ docId, error: e.message });
  }
});
