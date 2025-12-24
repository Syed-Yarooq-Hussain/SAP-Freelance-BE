const pdfParse = require('pdf-parse'); 
import * as fs from 'fs';
import OpenAI from 'openai';

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

export async function parseWithOpenAI(text: string) {
  const prompt = `
You are a JSON generator.

Return ONLY valid JSON.
No markdown.
No backticks.
No explanation text.

Required structure:
{
  "user.username": string | null,
  "user.phone": string | null,
  "user.email": string | null,
  "user.city": string | null,
  "user.country": string | null,
  "consultant.total_experience_years": number | null,
  "consultant.clients_summary": string | null,
  "consultant.skills": string[],
  "consultant.work_experiences": [
    {
      "company_name": string | null,
      "position": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "responsibilities": string[]
    }
  ],
  "consultant.education": [
    {
      "institution_name": string | null,
      "degree": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "details": string[]
    }
  ],
  "consultant.certifications": [
    {
      "certification_name": string | null,
      "issuing_organization": string | null,
      "issue_date": string | null,
      "expiration_date": string | null
    }
  ],
  "consultant.languages": string[]
}

CV:
"""${text}"""
`;

  const openai = getOpenAI();
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  const raw = response.output_text;

  // 👇 SAFE JSON CLEAN
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
}

