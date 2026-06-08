import { GoogleGenAI, Type } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { v4 as uuidv4 } from 'uuid';

type JsonRequest = IncomingMessage & { body?: unknown };

type Recipe = {
  id?: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  visualDescription: string;
  imageBase64?: string;
  createdAt?: string;
  reuseTip?: string;
};

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

function buildCourseInstruction(mode: string): string {
  switch (mode) {
    case '2品献立 (主菜+副菜)':
      return `以下の食材を使って、「主菜」と「副菜（または汁物）」の2品の献立を提案してください。出力は必ず2つのレシピオブジェクトを含む配列にしてください。reuseTipには2品間の食材の使い回しや調理を効率よく進めるポイントを書いてください。`;
    case '3日分作り置き':
      return `手元にある野菜を一気に使い切るための「3日分の作り置き（常備菜）」レシピを3品提案してください。出力は必ず3つのレシピオブジェクトを含む配列にしてください。reuseTipには日持ち日数や保存のコツを書いてください。`;
    case '3日分献立(朝+夕)':
      return `手元にある野菜と食材を効率よく使い回す「3日間の朝食と夕食（主菜+副菜）」の献立プランを作成してください。合計9品のレシピを配列で出力してください。reuseTipには前後の食材の使い回しや連携ポイントを書いてください。`;
    default:
      return `以下の食材を使って、美味しい料理を1品提案してください。出力は1つのレシピオブジェクトを含む配列にしてください。`;
  }
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
    const body = (await readJsonBody(req)) as {
      vegetables?: unknown;
      protein?: unknown;
      cookingTime?: unknown;
      mood?: unknown;
      allergies?: unknown;
      mode?: unknown;
    };

    const vegetables = Array.isArray(body.vegetables)
      ? body.vegetables.filter((item): item is string => typeof item === 'string').slice(0, 20)
      : [];
    const protein = typeof body.protein === 'string' ? body.protein.slice(0, 80) : '野菜のみ';
    const cookingTime = typeof body.cookingTime === 'string' ? body.cookingTime.slice(0, 40) : '指定なし';
    const mood = typeof body.mood === 'string' ? body.mood.slice(0, 40) : 'おまかせ';
    const mode = typeof body.mode === 'string' ? body.mode.slice(0, 40) : '1品提案';
    const allergies = Array.isArray(body.allergies)
      ? body.allergies.filter((item): item is string => typeof item === 'string').slice(0, 20)
      : [];

    if (vegetables.length === 0) {
      sendJson(res, 400, { error: '野菜を選択してください。' });
      return;
    }

    const prompt = `あなたはプロの家庭料理シェフであり、野菜を知り尽くしたベテラン農家でもあります。\n\n${buildCourseInstruction(mode)}\n\n【手元にある野菜】: ${vegetables.join(', ')}\n【追加バリエーション】: ${protein}\n【希望調理時間】: ${cookingTime}\n【料理の系統・気分】: ${mood}\n【使用しない食材（アレルギー・苦手など）】: ${allergies.length > 0 ? allergies.join(', ') : 'なし'}\n\n条件:\n1. 材料の分量は必ず2人分で作成してください。\n2. 調理時間の目安を守れるような調理法を選んでください。\n3. 使用しない食材が指定されている場合は、その食材を含む調味料や加工品も避けてください。\n4. 野菜のみの場合は、野菜の美味しさを引き出すレシピにしてください。\n5. 肉・魚・卵が指定されている場合は、一般的な食材を補ってください。\n6. visualDescriptionは料理画像生成用の英語の視覚描写にしてください。\n\nJSON配列だけで返してください。`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: RECIPE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              visualDescription: { type: Type.STRING },
              reuseTip: { type: Type.STRING },
            },
            required: ['title', 'ingredients', 'instructions', 'visualDescription', 'reuseTip'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const recipesArray = Array.isArray(parsed) ? parsed : [parsed];
    const recipes: Recipe[] = recipesArray.map((recipe: Recipe) => ({
      ...recipe,
      id: recipe.id || uuidv4(),
      createdAt: recipe.createdAt || new Date().toISOString(),
    }));

    sendJson(res, 200, recipes);
  } catch (error) {
    console.error('generate-recipes error:', error instanceof Error ? error.message : String(error));
    sendJson(res, 500, { error: 'レシピ生成に失敗しました。時間を置いて再度お試しください。' });
  }
}
