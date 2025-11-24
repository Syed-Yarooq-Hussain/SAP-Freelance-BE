import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';
// import { getLocalIp } from 'src/utils/get-ip';
import axios from 'axios';


@Injectable()
export class PdfService {
  async generatePdf( req: Request,data: { text?: string; imagePath?: string; title?: string }) {

    // 📁 Ensure PDF folder exists
    const pdfFolder = path.join(process.cwd(), 'pdf');
    if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder)

    const fileName = `file-${Date.now()}.pdf`;
    const filePath = path.join(pdfFolder, fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    // 📝 Title
    if (data.title) doc.fontSize(20).text(data.title).moveDown();
    if (data.text) doc.fontSize(14).text(data.text).moveDown();

    // 🖼 Image
    if (data.imagePath) {
      try {
        let imageBuffer;

        if (data.imagePath.startsWith('http')) {
          // Download image from URL
          const response = await axios.get(data.imagePath, { responseType: 'arraybuffer' });
          imageBuffer = Buffer.from(response.data);
        } else if (fs.existsSync(data.imagePath)) {
          // Local image file
          imageBuffer = fs.readFileSync(data.imagePath);
        }

        if (imageBuffer) {
          doc.image(imageBuffer, {
            fit: [400, 400],
            align: 'center',
            valign: 'center',
          });
          doc.moveDown();
        }
      } catch (error) {
        console.log("Image Error:", error.message);
      }
    }

    doc.end();

    // const ip = getLocalIp();

    const pdfUrl = `http://localhost:3000/pdf/${fileName}`;
    return { pdfUrl}
}
}