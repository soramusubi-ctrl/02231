import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { ProteinType, Recipe, CookingTime, RecipeMood, GenerationMode } from '../types';

// -------------------------------------------------------
// Gemini クライアント初期化
// Vercel 環境変数: VITE_GEMINI_API_KEY
// ローカル環境変数: .env.local の VITE_GEMINI_API_KEY
// -------------------------------------------------------
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!API_KEY) {
  console.warn(
    '[geminiService] VITE_GEMINI_API_KEY が設定されていません。' +
      '.env.local または Vercel の環境変数を確認してください。'
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const RECIPE_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-preview-04-17';

// -------------------------------------------------------
// レシピテキスト生成
// -------------------------------------------------------
export const generateRecipeText = async (
  vegetables: string[],
  protein: string,
  cookingTime: CookingTime,
  mood: RecipeMood,
  allergies: string[] = [],
  mode: GenerationMode = GenerationMode.SINGLE
): Promise<Recipe[]> => {
  if (vegetables.length === 0) {
    throw new Error('野菜を選択してください。');
  }

  let courseInstruction = '';

  switch (mode) {
    case GenerationMode.TWO_COURSE:
      courseInstruction = `
        以下の食材を使って、「主菜」と「副菜（または汁物）」の2品の献立を提案してください。
        手元にある野菜をできるだけ主菜と副菜の両方で使い回す組み合わせを優先してください。
        2品の味のバランスを考慮し、同時に調理しやすい組み合わせにしてください。
        出力は必ず2つのレシピオブジェクトを含む配列にしてください。
        【reuseTipフィールド】: 2品間でどのように食材を使い回したか、または調理を効率よく進めるための連携ポイントを記述してください。
      `;
      break;

    case GenerationMode.THREE_DAY_PREP:
      courseInstruction = `
        手元にある野菜を一気に使い切るための「3日分の作り置き（常備菜）」レシピを3品提案してください。
        冷蔵・冷凍保存しても味が落ちにくい料理を選んでください。
        3品は味のバリエーションを変えてください（例：醤油ベース、洋風マリネ、ピリ辛など）。
        出力は必ず3つのレシピオブジェクトを含む配列にしてください。
        【reuseTipフィールド】: この料理の日持ち日数や保存のコツを記述してください。
      `;
      break;

    case GenerationMode.THREE_DAY_FULL_PLAN:
      courseInstruction = `
        手元にある野菜と食材を効率よく使い回す「3日間の朝食と夕食（主菜+副菜）」の献立プランを作成してください。
        合計9品のレシピ（1日3品 × 3日分）を出力してください。

        以下の順序で配列を出力すること（厳守）：
        1. [1日目 朝食]
        2. [1日目 夕食・主菜]
        3. [1日目 夕食・副菜]
        4. [2日目 朝食]
        5. [2日目 夕食・主菜]
        6. [2日目 夕食・副菜]
        7. [3日目 朝食]
        8. [3日目 夕食・主菜]
        9. [3日目 夕食・副菜]

        出力は必ず9つのレシピオブジェクトを含む配列にしてください。
        【reuseTipフィールド】: 前日の食材の使い回しや翌日への連携ポイントを記述してください。
      `;
      break;

    default:
      courseInstruction = `
        以下の食材を使って、美味しい料理を1品提案してください。
        出力は1つのレシピオブジェクトを含む配列にしてください。
      `;
  }

  const prompt = `
    あなたはプロの家庭料理シェフであり、野菜を知り尽くしたベテラン農家でもあります。
    ${courseInstruction}

    【手元にある野菜】: ${vegetables.join(', ')}
    【追加バリエーション】: ${protein}
    【希望調理時間】: ${cookingTime}
    【料理の系統・気分】: ${mood}
    【使用しない食材（アレルギー・苦手など）】: ${allergies.length > 0 ? allergies.join(', ') : 'なし'}

    条件:
    1. 材料の分量は必ず【2人分】で作成してください。
    2. 調理時間の目安を守れるような調理法を選んでください。
    3. 「使用しない食材」が指定されている場合は、その食材を含む調味料や加工品も避けてください。
    4. 「野菜のみ」の場合は、野菜の美味しさを引き出すレシピにしてください。
    5. 肉・魚・卵が指定されている場合は、一般的な食材（豚肉、鮭、鶏卵など）を補ってください。

    出力はJSON配列形式で、以下のスキーマに従ってください。
    visualDescriptionは、AIが料理画像を生成するための具体的で美味しそうな視覚的描写（英語）を含めてください。
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: RECIPE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: '料理名' },
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '材料と分量のリスト（必ず2人分で記載）',
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '調理手順のリスト',
              },
              visualDescription: {
                type: Type.STRING,
                description:
                  '料理の完成図の視覚的な説明（英語）。皿の種類、盛り付け、湯気、色合いなど。',
              },
              reuseTip: {
                type: Type.STRING,
                description:
                  '食材の使い回しポイント、他の料理との連携、保存のコツ、または美味しく作るためのワンポイントアドバイス。',
              },
            },
            required: ['title', 'ingredients', 'instructions', 'visualDescription', 'reuseTip'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('レシピの生成に失敗しました。');

    const parsed = JSON.parse(text);
    const recipesArray = Array.isArray(parsed) ? parsed : [parsed];

    return recipesArray.map((r: Record<string, unknown>) => ({
      ...r,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    })) as Recipe[];
  } catch (error) {
    console.error('Recipe generation error:', error);
    throw error;
  }
};

// -------------------------------------------------------
// レシピ画像生成
// -------------------------------------------------------
export const generateRecipeImage = async (recipe: Recipe): Promise<string> => {
  try {
    const prompt = `
      Professional food photography of ${recipe.title}.
      ${recipe.visualDescription}.
      High resolution, appetizing, soft lighting, 4k, photorealistic, top-down view or 45-degree angle.
      Style: Modern cookbook.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {},
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('画像の生成に失敗しました。');

    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error('画像データが見つかりませんでした。');
  } catch (error) {
    console.error('Image generation error:', error);
    // フォールバック: プレースホルダー画像
    return `https://picsum.photos/seed/${encodeURIComponent(recipe.title)}/800/600?blur=1`;
  }
};

// -------------------------------------------------------
// 野菜画像認識
// -------------------------------------------------------
export const identifyVegetables = async (base64Image: string): Promise<string[]> => {
  try {
    const match = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error('Invalid image data');

    const mimeType = match[1];
    const data = match[2];

    const prompt = `
      Identify the vegetables in this image.
      Return the result as a JSON array of strings in Japanese.
      Example: ["にんじん", "玉ねぎ"]
      If no vegetables are found, return [].
      Ignore non-vegetable items.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
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

    const text = response.text;
    if (!text) return [];

    return JSON.parse(text) as string[];
  } catch (error) {
    console.error('Vegetable identification error:', error);
    throw error;
  }
};
