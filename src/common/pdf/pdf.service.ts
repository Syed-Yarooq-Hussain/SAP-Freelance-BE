import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/utility/common.service';
import { Request } from 'express';

@Injectable()
export class PdfService {
  constructor(private readonly commonService: CommonService) {}

  async generatePdf(req: Request, data) {
    return this.commonService.generatePdf(req, data);
  }
}