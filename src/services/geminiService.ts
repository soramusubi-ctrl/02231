import { v4 as uuidv4 } from 'uuid';
import { ProteinType, Recipe, CookingTime, RecipeMood, GenerationMode } from '../types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : '処理に失敗しました。');
  }

  return data as T;
}

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

  const recipes = await postJson<Recipe[]>('/api/generate-recipes', {
    vegetables,
    protein,
    cookingTime,
    mood,
    allergies,
    mode,
  });

  return recipes.map((recipe) => ({
    ...recipe,
    id: recipe.id || uuidv4(),
    createdAt: recipe.createdAt || new Date().toISOString(),
  }));
};

export const generateRecipeImage = async (recipe: Recipe): Promise<string> => {
  try {
    const data = await postJson<{ imageBase64: string }>('/api/generate-recipe-image', { recipe });
    return data.imageBase64;
  } catch (error) {
    console.error('Image generation error:', error);
    return `https://picsum.photos/seed/${encodeURIComponent(recipe.title)}/800/600?blur=1`;
  }
};

export const identifyVegetables = async (base64Image: string): Promise<string[]> => {
  const data = await postJson<{ vegetables: string[] }>('/api/identify-vegetables', { base64Image });
  return data.vegetables;
};

export { ProteinType };
