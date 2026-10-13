const pdfParse = require('pdf-parse'); 
import * as fs from 'fs';
import OpenAI from 'openai';
import * as mammoth from 'mammoth';

let openai: OpenAI;

export function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }
  return openai;
}

export async function extractText(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractResumeTextFromBuffer(
  buffer: Buffer,
  mimetype?: string,
  filename?: string,
): Promise<string> {
  const normalizedMime = String(mimetype || '').toLowerCase();
  const normalizedName = String(filename || '').toLowerCase();
  // Drive download URLs often have no extension or reliable MIME type.
  const hasPdfSignature = buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'));
  const hasZipSignature = buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  const hasDocxSignature = hasZipSignature && buffer.includes(Buffer.from('word/document.xml'));
  if (hasPdfSignature) return extractTextFromBuffer(buffer);
  if (hasDocxSignature) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
    throw new Error('Legacy Office format (.doc) is not supported; convert the resume to DOCX or PDF and retry');
  }
  const isDocx =
    normalizedMime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    normalizedName.endsWith('.docx');
  const isPdf =
    normalizedMime === 'application/pdf' || normalizedName.endsWith('.pdf');

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (isPdf) return extractTextFromBuffer(buffer);

  throw new Error('Only PDF and DOCX resume files are supported');
}

export async function parseWithOpenAI(text: string) {
  const prompt = `
You are a JSON generator.

Return ONLY valid JSON.
No markdown.
No backticks.
No explanation text.

-------------------------------------
REQUIRED JSON STRUCTURE:
-------------------------------------

{
  "username": string | null,
  "phone": string | null,
  "email": string | null,
  "city": string | null,
  "country": string | null,
  "total_experience_years": number | null,

  "profile_summary": string,

  "clients_summary": string | null,

  "skills": string[],

  "projects": [
    {
      "project_name": string | null,
      "client_name": string | null,
      "summary": string,
      "start_date": string | null,
      "end_date": string | null
    }
  ],

  "work_experiences": [
    {
      "company_name": string | null,
      "position": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "responsibilities": string[]
    }
  ],

  "education": [
    {
      "institution_name": string | null,
      "degree": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "details": string[]
    }
  ],

  "certifications": [
    {
      "certification_name": string | null,
      "issuing_organization": string | null,
      "issue_date": string | null,
      "expiration_date": string | null
    }
  ],

  "languages": string[]
}

-------------------------------------
PROFILE SUMMARY RULES (VERY STRICT)
-------------------------------------

Generate EXACTLY 5 lines (or 4 if no extra modules).

Line 1:
<Experience Level> SAP <Core Module(s)> Consultant with <X+ years> of experience in <core modules>.

Line 2:
Experienced in <project types> with strong expertise in <key capabilities>.

Line 3 (ONLY if applicable):
Also skilled in <Other Modules> supporting cross-functional process design and governance.

Line 4:
Has worked across industries including <industry1>, <industry2>, <industry3>.

Line 5:
Delivered <X+ SAP projects> including <implementation/rollout/support types>.

Rules:
- No headings
- No bullets
- No extra text
- Strict professional tone

-------------------------------------
EXPERIENCE LEVEL MAPPING
-------------------------------------
<=1: Junior
2-3: Associate
4-6: Mid Level
7-9: Senior
10-12: Principal
13+: Architect

-------------------------------------
PROJECT EXTRACTION RULES
-------------------------------------

Extract ALL projects from CV.

For EACH project:

- project_name → from CV (or infer from context)
- client_name → extract if available
- summary → MUST be 100 to 120 words (very important)
- start_date / end_date rules:

  1. If exact dates exist → use them
  2. If only month/year → use that
  3. If only duration → infer approximate dates
  4. If nothing → infer realistic timeline from CV career progression

Dates format: YYYY-MM or YYYY-MM-DD

-------------------------------------
CLIENT SUMMARY (keep as before)
-------------------------------------


Generate EXACTLY 5 lines (or 4 if no extra modules).

Line 1:
<Experience Level> SAP <Core Module(s)> Consultant with <X+ years> of experience in <core modules>.

Line 2:
Experienced in <project types> with strong expertise in <key capabilities>.

Line 3 (ONLY if applicable):
Also skilled in <Other Modules> supporting cross-functional process design and governance.

Line 4:
Has worked across industries including <industry1>, <industry2>, <industry3>.

Line 5:
Delivered <X+ SAP projects> including <implementation/rollout/support types>.

Rules:
- No headings
- No bullets
- No extra text
- Strict professional tone

-------------------------------------
IMPORTANT RULES
-------------------------------------

- Do NOT hallucinate
- Do NOT leave empty array unless absolutely no data
- Keep summaries professional
- Skills should be deduplicated
- Use only CV data

-------------------------------------
CV:
"""${text}"""
`;

  const openai = getOpenAI();

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  const raw = response.output_text;

  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
}

