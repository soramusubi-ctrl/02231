import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';

type JsonRequest = IncomingMessage & { body?: unknown };

type Recipe = {
  title: string;
  visualDescription?: string;
};

const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

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
    const body = (await readJsonBody(req)) as { recipe?: unknown };
    const recipe = body.recipe as Recipe | undefined;
    const title = typeof recipe?.title === 'string' ? recipe.title.slice(0, 120) : '';
    const visualDescription = typeof recipe?.visualDescription === 'string' ? recipe.visualDescription.slice(0, 1200) : '';

    if (!title) {
      sendJson(res, 400, { error: '料理名がありません。' });
      return;
    }

    const prompt = [
      'Generate a single professional food photograph of the following Japanese home-cooked dish:',
      `Dish name: "${title}"`,
      `Visual description: ${visualDescription || 'fresh home-cooked Japanese dish, plated and ready to eat'}`,
      '',
      'Requirements:',
      '- The image must show the specific dish described above, plated and ready to eat.',
      '- Do not generate landscapes, scenery, people, packaging, menus, or unrelated images.',
      '- Style: overhead or 45-degree angle food photography, soft natural lighting, shallow depth of field.',
      '- Background: clean wooden table or neutral linen cloth.',
      '- The food should look appetizing, fresh, and home-cooked.',
      '- Aspect ratio: 4:3, resolution: 1K.',
    ].join('\n');

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '4:3',
          imageSize: '1K',
        },
      },
    });

    for (const part of response.parts || []) {
      if ((part as { thought?: boolean }).thought) continue;
      if (part.inlineData?.data) {
        sendJson(res, 200, {
          imageBase64: `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`,
        });
        return;
      }
    }

    sendJson(res, 502, { error: '画像の生成に失敗しました。' });
  } catch (error) {
    console.error('generate-recipe-image error:', error instanceof Error ? error.message : String(error));
    sendJson(res, 500, { error: '画像生成に失敗しました。時間を置いて再度お試しください。' });
  }
}
