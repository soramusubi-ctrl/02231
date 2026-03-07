
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { ProteinType, Recipe, CookingTime, RecipeMood, GenerationMode } from "../types";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY is guaranteed to be available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RECIPE_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const generateRecipeText = async (
  vegetables: string[],
  protein: string,
  cookingTime: CookingTime,
  mood: RecipeMood,
  allergies: string[] = [],
  mode: GenerationMode = GenerationMode.SINGLE
): Promise<Recipe[]> => {
  if (vegetables.length === 0) {
    throw new Error("野菜を選択してください。");
  }

  let courseInstruction = "";

  switch (mode) {
    case GenerationMode.TWO_COURSE:
      courseInstruction = `
        以下の食材を使って、「主菜」と「副菜（または汁物）」の2品の献立を提案してください。
        【重要】手元にある野菜をできるだけ主菜と副菜の両方で使い回す（例：キャベツを半分は炒め物に、もう半分はサラダになど）ような、食材を無駄なく楽しめる組み合わせを優先してください。
        2品の味のバランス（例：主菜が濃い味なら副菜はさっぱりなど）を考慮し、同時に調理しやすい組み合わせにしてください。
        出力は必ず2つのレシピオブジェクトを含む配列にしてください。
        【reuseTipフィールド】: 2品間でどのように食材を使い回したか、または調理を効率よく進めるための連携ポイントを記述してください。
      `;
      break;
    case GenerationMode.THREE_DAY_PREP:
      courseInstruction = `
        手元にある野菜を一気に使い切るための「3日分の作り置き（常備菜）」レシピを3品提案してください。
        【重要】
        1. 冷蔵・冷凍保存しても味が落ちにくい、または味が馴染んで美味しくなる料理を選んでください（煮浸し、マリネ、煮込み、炒め煮など）。
        2. 3品は味のバリエーションを変えてください（例：1品目は醤油ベース、2品目は洋風マリネ、3品目はピリ辛など）。
        3. 手元の野菜を効率よく使い切る構成にしてください。
        出力は必ず3つのレシピオブジェクトを含む配列にしてください。
        【reuseTipフィールド】: この料理の日持ち日数や、保存のコツ、または他の日の料理と共通して下処理した野菜の活用など、効率的なポイントを記述してください。
      `;
      break;
    case GenerationMode.THREE_DAY_FULL_PLAN:
      courseInstruction = `
        手元にある野菜と食材を効率よく使い回す「3日間の朝食と夕食（主菜+副菜）」の献立プランを作成してください。
        合計9品のレシピ（1日3品 × 3日分）を出力してください。
        
        【構成】
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

        【最重要：食材の使い回し戦略】
        - 3日間を通して食材を無駄なく使い切るストーリーを作ってください。
        - 例: 「1日目にひき肉を多めに炒めてそぼろにし、1日目はビビンバ、2日目はオムレツの具、3日目は麻婆茄子にする」や「1日目に野菜スープを大量に作り、2日目はカレーにリメイクする」など。
        
        【reuseTipフィールド】: 「1日目の〇〇の残りを活用」や「ここで多めに茹でた〇〇は3日目に使います」など、具体的な食材の使い回し・リメイクの流れ（ストーリー）を記述してください。これが最も重要な情報です。
      `;
      break;
    default: // SINGLE
      courseInstruction = `
        以下の条件に合わせて、美味しくて簡単な日本の家庭料理のレシピを1つ提案してください。
        出力は1つのレシピオブジェクトを含む配列にしてください。
        【reuseTipフィールド】: 美味しく作るためのコツや、野菜の栄養を逃さないポイントを簡潔に記述してください。
      `;
      break;
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
    2. 調理時間の目安を守れるような調理法（例：時短ならレンジ活用や炒め物、長めなら煮込みなど）を選んでください。
    3. 「使用しない食材」が指定されている場合は、その食材そのものだけでなく、それを含む調味料や加工品も避けたレシピにしてください。安全を最優先してください。
    4. もし「野菜のみ」の場合は、野菜の美味しさを引き出すレシピにしてください。
    5. 肉、魚、卵が指定されている場合は、一般的なそのカテゴリの食材（例：豚肉、鮭、鶏卵など）を適宜補ってレシピを作成してください。
    
    出力はJSON配列形式で、以下のスキーマに従ってください。
    visualDescriptionは、後でAIがこの料理の画像を生成するために使う、具体的で美味しそうな視覚的描写（英語）を含めてください。
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: RECIPE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "料理名" },
              ingredients: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "材料と分量のリスト（必ず2人分で記載）" 
              },
              instructions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "調理手順のリスト" 
              },
              visualDescription: {
                type: Type.STRING,
                description: "料理の完成図の視覚的な説明（英語）。皿の種類、盛り付け、湯気、色合いなど。"
              },
              reuseTip: {
                type: Type.STRING,
                description: "食材の使い回しポイント、他の料理との連携、保存のコツ、または美味しく作るためのワンポイントアドバイス。"
              }
            },
            required: ["title", "ingredients", "instructions", "visualDescription", "reuseTip"],
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("レシピの生成に失敗しました。");
    
    const parsed = JSON.parse(text);
    // Ensure we work with an array even if something goes weird (though schema enforces it)
    const recipesArray = Array.isArray(parsed) ? parsed : [parsed];

    return recipesArray.map((r: any) => ({
      ...r,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    })) as Recipe[];

  } catch (error) {
    console.error("Recipe generation error:", error);
    throw error;
  }
};

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
      config: {
        // No responseMimeType for image model in this context if we want inlineData usually, 
        // but generateContent for image models returns candidates with inlineData if generated.
      }
    });

    // Extract image from response
    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("画像の生成に失敗しました。");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("画像データが見つかりませんでした。");
  } catch (error) {
    console.error("Image generation error:", error);
    // Return a placeholder if generation fails to avoid breaking UI
    return `https://picsum.photos/800/600?blur=2`; 
  }
};

export const identifyVegetables = async (base64Image: string): Promise<string[]> => {
  try {
    // Extract base64 data
    const match = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data");
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
      model: RECIPE_MODEL, // Using gemini-2.5-flash which supports multimodal
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Vegetable identification error:", error);
    throw error;
  }
};
