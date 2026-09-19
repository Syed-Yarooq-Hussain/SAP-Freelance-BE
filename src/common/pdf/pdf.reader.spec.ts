jest.mock('pdf-parse', () => jest.fn());
jest.mock('mammoth', () => ({ extractRawText: jest.fn() }));

import * as mammoth from 'mammoth';
import { extractResumeTextFromBuffer } from './pdf.reader';

const pdfParse = require('pdf-parse');

describe('extractResumeTextFromBuffer', () => {
  afterEach(() => jest.clearAllMocks());

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
