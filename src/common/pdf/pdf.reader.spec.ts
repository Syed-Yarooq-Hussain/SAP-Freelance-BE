jest.mock('pdf-parse', () => jest.fn());
jest.mock('mammoth', () => ({ extractRawText: jest.fn() }));

import * as mammoth from 'mammoth';
import { extractResumeTextFromBuffer } from './pdf.reader';

const pdfParse = require('pdf-parse');

describe('extractResumeTextFromBuffer', () => {
  afterEach(() => jest.clearAllMocks());

  it('detects DOCX from Drive bytes without filename or MIME', async () => {
    (mammoth.extractRawText as jest.Mock).mockResolvedValue({ value: 'Word resume' });
    const buffer = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('word/document.xml')]);
    await expect(extractResumeTextFromBuffer(buffer)).resolves.toBe('Word resume');
    expect(pdfParse).not.toHaveBeenCalled();
  });

  it('detects PDF from Drive bytes', async () => {
    pdfParse.mockResolvedValue({ text: 'PDF resume' });
    await expect(extractResumeTextFromBuffer(Buffer.from('%PDF-1.7'))).resolves.toBe('PDF resume');
  });

  it('reports legacy Office files instead of sending them to the PDF parser', async () => {
    await expect(extractResumeTextFromBuffer(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])))
      .rejects.toThrow('Legacy Office format');
    expect(pdfParse).not.toHaveBeenCalled();
  });

  it('extracts DOCX text using mammoth', async () => {
    (mammoth.extractRawText as jest.Mock).mockResolvedValue({
      value: 'DOCX resume text',
      messages: [],
    });

    await expect(
      extractResumeTextFromBuffer(
        Buffer.from('docx'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'resume.docx',
      ),
    ).resolves.toBe('DOCX resume text');
  });

  it('keeps PDF extraction compatible', async () => {
    pdfParse.mockResolvedValue({ text: 'PDF resume text' });

    await expect(
      extractResumeTextFromBuffer(
        Buffer.from('pdf'),
        'application/pdf',
        'resume.pdf',
      ),
    ).resolves.toBe('PDF resume text');
  });

  it('rejects unsupported resume formats', async () => {
    await expect(
      extractResumeTextFromBuffer(
        Buffer.from('doc'),
        'application/msword',
        'resume.doc',
      ),
    ).rejects.toThrow('Only PDF and DOCX resume files are supported');
  });
});
