import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createEnglishSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const page1 = doc.addPage([595, 842]); // A4
  page1.drawText('TBiB PDF Viewer — Multi-Page Exam Paper', {
    x: 50,
    y: 780,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.6),
  });
  page1.drawText('Section A: General Mathematics & Calculus', {
    x: 50,
    y: 740,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText('Instructions: Use the pen tool to draw your working steps. Highlight important formulas.', {
    x: 50,
    y: 710,
    size: 11,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page1.drawText('Question 1: Evaluate the integral of f(x) = 3x^2 + 4x - 5 from x = 1 to 4.', {
    x: 50,
    y: 660,
    size: 12,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page1.drawRectangle({
    x: 50,
    y: 350,
    width: 495,
    height: 280,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });
  page1.drawText('[ Working area for student pen annotations ]', {
    x: 180,
    y: 490,
    size: 11,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Page 2
  const page2 = doc.addPage([595, 842]);
  page2.drawText('Section B: Geometry & Vector Calculus (Page 2)', {
    x: 50,
    y: 780,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.6),
  });
  page2.drawText('Question 2: Draw a bounding box around the area of interest using Rectangle tool.', {
    x: 50,
    y: 740,
    size: 12,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Page 3
  const page3 = doc.addPage([595, 842]);
  page3.drawText('Section C: Conclusions & Review (Page 3)', {
    x: 50,
    y: 780,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.6),
  });
  page3.drawText('Place a note pin with your comments and final score.', {
    x: 50,
    y: 740,
    size: 12,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  return doc.save();
}

export async function createArabicSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([595, 842]);
  page.drawText('TBiB Arabic PDF Test - تجربة اللغة العربية', {
    x: 50,
    y: 780,
    size: 18,
    font,
    color: rgb(0.1, 0.4, 0.2),
  });
  page.drawText('اختبار التظليل للنصوص باللغة العربية والتأكد من تحديد الصناديق بدقة', {
    x: 50,
    y: 730,
    size: 13,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('هذا السطر الثاني مخصص لاختبار النصوص من اليمين إلى اليسار', {
    x: 50,
    y: 690,
    size: 12,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  return doc.save();
}

export async function createScannedSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);

  // Draw pure vector rectangles/lines simulating a scanned exam sheet without a PDF text layer
  page.drawRectangle({
    x: 40,
    y: 40,
    width: 515,
    height: 762,
    color: rgb(0.96, 0.96, 0.94),
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 2,
  });

  page.drawLine({
    start: { x: 50, y: 750 },
    end: { x: 545, y: 750 },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  return doc.save();
}
