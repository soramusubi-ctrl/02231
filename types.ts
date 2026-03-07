
export enum ProteinType {
  NONE = '野菜のみ (Vegetables Only)',
  MEAT = '＋肉 (Add Meat)',
  FISH = '＋魚 (Add Fish)',
  EGG = '＋卵 (Add Egg)',
  OTHER = '＋その他 (Other)',
}

export enum CookingTime {
  SHORT = '10分以内',
  MEDIUM = '20分以内',
  LONG = '30分以上',
  ANY = '指定なし',
}

export enum RecipeMood {
  ANY = 'おまかせ',
  JAPANESE = '和風',
  CHINESE = '中華風',
  WESTERN = '洋風',
  REFRESHING = 'サッパリ系',
  HEARTY = 'ガッツリ系',
  KIDS = '子供向け',
  TSUMAMI = 'おつまみ',
  SIMPLE = '素材本来の味',
  FARMER = '農家直伝/珍しい野菜',
}

export enum GenerationMode {
  SINGLE = '1品提案',
  TWO_COURSE = '2品献立 (主菜+副菜)',
  THREE_DAY_PREP = '3日分作り置き',
  THREE_DAY_FULL_PLAN = '3日分献立(朝+夕)',
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  visualDescription: string; // Used for image generation prompt
  imageBase64?: string; // Generated later
  createdAt?: string;
  reuseTip?: string; // Advice on ingredient reuse or meal planning
}

export interface Vegetable {
  id: string;
  name: string;
}

export interface RecipeState {
  recipes: Recipe[]; // Changed from 'data: Recipe | null' to support multiple recipes
  loading: boolean;
  imageLoading: boolean;
  error: string | null;
}
