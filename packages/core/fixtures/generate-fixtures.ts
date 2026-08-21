import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export async function generateSamplePdfFixtures(outDir: string): Promise<void> {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. English Multi-page Document
  const englishDoc = await PDFDocument.create();
  const font = await englishDoc.embedFont(StandardFonts.Helvetica);

  // Page 1
  const page1 = englishDoc.addPage([600, 800]);
  page1.drawText('TBiB PDF Viewer Test Document', {
    x: 50,
    y: 730,
    size: 24,
    font,
    color: rgb(0, 0.2, 0.6),
  });
  page1.drawText('This is page 1 with selectable standard English text.', {
    x: 50,
    y: 680,
    size: 14,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page1.drawText('Highlighting this text tests the quad detection and coordinate mapping.', {
    x: 50,
    y: 650,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Page 2
  const page2 = englishDoc.addPage([600, 800]);
  page2.drawText('Page 2: Exam Questions & Diagram Area', {
    x: 50,
    y: 730,
    size: 20,
    font,
    color: rgb(0, 0, 0),
  });
  page2.drawText('Question 1: Draw freehand notes and highlight the key terms.', {
    x: 50,
    y: 680,
    size: 12,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const englishBytes = await englishDoc.save();
  fs.writeFileSync(path.join(outDir, 'sample-english.pdf'), englishBytes);

  // 2. Arabic / RTL Document
  const arabicDoc = await PDFDocument.create();
  const pageAr = arabicDoc.addPage([600, 800]);
  // PDF.js text layer extracts strings and direction
  pageAr.drawText('وثيقة اختبار مكتبة قارئ بي دي اف', {
    x: 100,
    y: 700,
    size: 18,
    font,
    color: rgb(0, 0.4, 0.2),
  });
  pageAr.drawText('هذا النص باللغة العربية لاختبار التمييز والتظليل وتحديد المربعات بدقة', {
    x: 100,
    y: 650,
    size: 12,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  const arabicBytes = await arabicDoc.save();
  fs.writeFileSync(path.join(outDir, 'sample-arabic.pdf'), arabicBytes);

  // 3. Scanned PDF (Only shapes/images, no text)
  const scannedDoc = await PDFDocument.create();
  const pageScanned = scannedDoc.addPage([600, 800]);
  pageScanned.drawRectangle({
    x: 50,
    y: 100,
    width: 500,
    height: 600,
    color: rgb(0.95, 0.95, 0.95),
  });
  const scannedBytes = await scannedDoc.save();
  fs.writeFileSync(path.join(outDir, 'sample-scanned.pdf'), scannedBytes);
}

if (require.main === module) {
  const dir = path.join(__dirname, 'data');
  generateSamplePdfFixtures(dir).then(() => {
    console.log('Sample PDF fixtures generated at ' + dir);
  });
}
