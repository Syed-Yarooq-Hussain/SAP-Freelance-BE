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

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
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
  "username": string | null,
  "phone": string | null,
  "email": string | null,
  "city": string | null,
  "country": string | null,
  "total_experience_years": number | null,
  "clients_summary": string | null,
  "skills": string[],
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

For the "clients_summary" field, contain the following information in a concise summary format:

  - **Name:** (from CV)
  - **Current Role:** (latest job title)
  - **Total SAP Experience:** X years
  - **Core Modules:** (max 2 most prominent SAP modules)
  - **Industries:** (max 4 industries worked in)
  - **Projects:** (total number of projects/companies)
  - **Current Location:** (city, country)
  - **SAP Versions:** (list from: ECC / S/4HANA / Cloud)

  ## SKILLS
  **SAP Functional Skills:** (comma separated)
  **Business Processes:** (comma separated)
  **Integration Exposure:** (comma separated)
  **Support / Delivery Capabilities:** (comma separated)
  **Tools & Platforms:** (comma separated)

For the "username" field, generate a structured SAP consultant profile in this exact format:
 --Name should be full name and with proper spaces

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

