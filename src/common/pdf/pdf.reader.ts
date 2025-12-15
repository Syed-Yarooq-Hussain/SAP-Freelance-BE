import extract from 'pdf-text-extract';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function extractText(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    extract(filePath, (err, pages) => {
      if (err) return reject(err);
      resolve(pages.join('\n'));
    });
  });
}
export async function parseWithOpenAI(text: string) {
  const prompt = `
Extract structured data from this CV.
Return only valid JSON.

Fields:
- full_name
- email
- city
- country
- total_experience_years
- clients_summary

CV:
"""${text}"""
`;

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: prompt,
  });

  return JSON.parse(response.output_text);
}
