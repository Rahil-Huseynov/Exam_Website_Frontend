export function pdfParseForWriting(pages: string[]) {
  const questions: { qNo: number; text: string }[] = [];
  let currentQNo: number | null = null;
  let currentText = '';
  for (const page of pages) {
    const lines = page.split('\n');
    for (let rawLine of lines) {
      let line = rawLine.trim();
      if (!line) continue;
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        if (currentQNo !== null && currentText.trim()) {
          questions.push({ qNo: currentQNo, text: currentText.trim() });
        }
        currentQNo = parseInt(match[1], 10);
        currentText = match[2].trim();
      } else if (currentQNo !== null) {
        currentText += ' ' + line;
      }
    }
  }
  if (currentQNo !== null && currentText.trim()) {
    questions.push({ qNo: currentQNo, text: currentText.trim() });
  }
  questions.sort((a, b) => a.qNo - b.qNo);
  return questions;
}
