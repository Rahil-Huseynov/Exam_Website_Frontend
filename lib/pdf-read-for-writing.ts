
import * as pdfjsLib from 'pdfjs-dist';

export async function pdfReadForWriting(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';
        const pdfData = new Uint8Array(reader.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const pages: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          textContent.items.sort((a: any, b: any) => {
            const ya = a.transform[5];
            const yb = b.transform[5];
            if (Math.abs(ya - yb) < 0.1) {
              return a.transform[4] - b.transform[4]; 
            }
            return yb - ya; 
          });
          const lines: string[] = [];
          let currentLine: string[] = [];
          let lastY: number | null = null;
          const threshold = 2; 
          for (const item of textContent.items as any[]) {
            const y = item.transform[5];
            if (lastY !== null && Math.abs(y - lastY) > threshold) {
              if (currentLine.length > 0) {
                lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim());
              }
              currentLine = [];
            }
            currentLine.push(item.str);
            lastY = y;
          }
          if (currentLine.length > 0) {
            lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim());
          }
          const pageText = lines.join('\n');
          pages.push(pageText);
          if (onProgress) {
            onProgress(Math.round((i / numPages) * 100));
          }
        }
        resolve(pages);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}