import { Controller, Post, Body, Req } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { Request } from 'express';


@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('create')
  async generate(@Req() req: Request,@Body() body: any) {
    return this.pdfService.generatePdf(req, body);
  }
}
