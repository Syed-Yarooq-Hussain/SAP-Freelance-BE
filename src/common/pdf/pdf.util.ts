import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';

export async function generatePdf(data: any) {
  const pdfFolder = path.join(process.cwd(), 'pdf');
  if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder);

  const fileName = `file-${Date.now()}.pdf`;
  const filePath = path.join(pdfFolder, fileName);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  if (data.title) doc.fontSize(20).text(data.title).moveDown();
  if (data.text) doc.fontSize(14).text(data.text).moveDown();

  if (data.imagePath) {
    try {
      let imageBuffer;

      if (data.imagePath.startsWith('http')) {
        const response = await axios.get(data.imagePath, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
      } else if (fs.existsSync(data.imagePath)) {
        imageBuffer = fs.readFileSync(data.imagePath);
      }

      if (imageBuffer) {
        doc.image(imageBuffer, {
          fit: [400, 400],
          align: 'center',
          valign: 'center',
        });
      }
    } catch (err) {
      console.log("Image Error:", err.message);
    }
  }

  doc.end();

  return {
    pdfUrl: `${process.env.PDF_PUBLIC_URL}${fileName}`,
  };
}
