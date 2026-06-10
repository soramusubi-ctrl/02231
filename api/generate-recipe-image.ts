import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';

type JsonRequest = IncomingMessage & { body?: unknown };

type Recipe = {
  title: string;
  visualDescription?: string;
};

type ImagePart = {
  thought?: boolean;
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
};

type ImageResponse = {
  parts?: ImagePart[];
  candidates?: Array<{
    content?: {
      parts?: ImagePart[];
    };
  }>;
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

function findImagePart(response: ImageResponse): ImagePart | undefined {
  const parts = [
    ...(response.parts || []),
    ...(response.candidates?.flatMap((candidate) => candidate.content?.parts || []) || []),
  ];

  return parts.find((part) => !part.thought && Boolean(part.inlineData?.data));
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
      'Create one realistic food photograph of this exact home-cooked dish.',
      `Dish name: ${title}`,
      `Dish description: ${visualDescription || 'fresh Japanese home-cooked dish, plated and ready to eat'}`,
      '',
      'Important rules:',
      '- Show only the finished food dish on a plate or bowl.',
      '- Do not show forests, landscapes, farms, fields, people, packages, menus, text, logos, or unrelated scenes.',
      '- The image must match the dish name and ingredients.',
      '- Style: simple home cooking, natural light, appetizing, clean table.',
      '- Camera: overhead or 45-degree food photography.',
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
    }) as ImageResponse;

    const imagePart = findImagePart(response);
    if (imagePart?.inlineData?.data) {
      sendJson(res, 200, {
        imageBase64: `data:${imagePart.inlineData.mimeType ?? 'image/png'};base64,${imagePart.inlineData.data}`,
      });
      return;
    }

    console.error('generate-recipe-image no image part', JSON.stringify({
      hasParts: Boolean(response.parts?.length),
      candidateCount: response.candidates?.length || 0,
      candidateParts: response.candidates?.map((candidate) => candidate.content?.parts?.length || 0) || [],
    }));
    sendJson(res, 502, { error: '画像データが返りませんでした。' });
  } catch (error) {
    console.error('generate-recipe-image error:', error instanceof Error ? error.message : String(error));
    sendJson(res, 500, { error: '画像生成に失敗しました。時間を置いて再度お試しください。' });
  }
}
