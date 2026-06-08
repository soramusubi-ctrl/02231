import { GoogleGenAI, Type } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';

type JsonRequest = IncomingMessage & { body?: unknown };

const RECIPE_MODEL = 'gemini-3-flash-preview';

async function readJsonBody(req: JsonRequest): Promise<unknown> {
  if (req.body) {
    if (typeof req.body === 'string') return JSON.parse(req.body) as unknown;
    return req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req: JsonRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: 'サーバー設定エラーです。' });
    return;
  }

  try {
    const body = (await readJsonBody(req)) as { base64Image?: unknown };
    const base64Image = typeof body.base64Image === 'string' ? body.base64Image : '';
    const match = base64Image.match(/^data:(.+);base64,(.+)$/);

    if (!match) {
      sendJson(res, 400, { error: '画像データが正しくありません。' });
      return;
    }

    const mimeType = match[1];
    const data = match[2];
    const prompt = 'Identify the vegetables in this image. Return the result as a JSON array of strings in Japanese. Example: ["にんじん", "玉ねぎ"]. If no vegetables are found, return []. Ignore non-vegetable items.';

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: RECIPE_MODEL,
      contents: {
        parts: [{ inlineData: { mimeType, data } }, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const vegetables = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 20)
      : [];

    sendJson(res, 200, { vegetables });
  } catch (error) {
    console.error('identify-vegetables error:', error instanceof Error ? error.message : String(error));
    sendJson(res, 500, { error: '野菜の読み取りに失敗しました。時間を置いて再度お試しください。' });
  }
}
