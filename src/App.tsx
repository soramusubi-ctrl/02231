import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Header } from './components/Header';
import { VegetableManager } from './components/VegetableManager';
import { RecipeCard } from './components/RecipeCard';
import { ShoppingList } from './components/ShoppingList';
import {
  Vegetable,
  ProteinType,
  RecipeState,
  CookingTime,
  RecipeMood,
  Recipe,
  GenerationMode,
  AppView,
} from './types';
import { generateRecipeText, generateRecipeImage } from './services/geminiService';
import { findMatchingFarmerRecipes, farmerRecipeToRecipe } from './data/farmerRecipes';

// -------------------------------------------------------
// LocalStorage キー
// -------------------------------------------------------
const STORAGE_KEY_VEGGIES = 'veggie-chef-vegetables';
const STORAGE_KEY_ALLERGIES = 'veggie-chef-allergies';
const STORAGE_KEY_RECIPES = 'veggie-chef-recipes';
const STORAGE_KEY_SHOPPING_LIST = 'veggie-chef-shopping-list';

// -------------------------------------------------------
// 初期野菜リスト
// -------------------------------------------------------
const INITIAL_VEGGIES = [
  'トマト', 'ミニトマト', 'じゃがいも', '大根', 'レタス', 'にんじん',
];

// -------------------------------------------------------
// ラベル生成ヘルパー
// -------------------------------------------------------
const getLabelForRecipe = (index: number, mode: GenerationMode): string => {
  if (mode === GenerationMode.TWO_COURSE) {
    return index === 0 ? '主菜' : '副菜';
  }
  if (mode === GenerationMode.THREE_DAY_PREP) {
    return `作り置き ${index + 1}品目`;
  }
  if (mode === GenerationMode.THREE_DAY_FULL_PLAN) {
    const day = Math.floor(index / 3) + 1;
    const typeIndex = index % 3;
    const typeLabel = typeIndex === 0 ? '朝食' : typeIndex === 1 ? '夕食（主菜）' : '夕食（副菜）';
    return `${day}日目 ${typeLabel}`;
  }
  return '';
};

// -------------------------------------------------------
// App コンポーネント
// -------------------------------------------------------
export default function App() {
  // --- ビュー ---
  const [currentView, setCurrentView] = useState<AppView>('home');

  // --- 野菜 ---
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // --- レシピ設定 ---
  const [proteinType, setProteinType] = useState<ProteinType>(ProteinType.NONE);
  const [customProtein, setCustomProtein] = useState('');
  const [cookingTime, setCookingTime] = useState<CookingTime>(CookingTime.ANY);
  const [recipeMood, setRecipeMood] = useState<RecipeMood>(RecipeMood.ANY);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.SINGLE);

  // --- アレルギー ---
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  // --- レシピ状態 ---
  const [recipeState, setRecipeState] = useState<RecipeState>({
    recipes: [],
    loading: false,
    imageLoading: false,
    error: null,
  });

  // --- 保存済みレシピ・買い物リスト ---
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  // -------------------------------------------------------
  // LocalStorage 読み込み
  // -------------------------------------------------------
  const loadDefaults = useCallback(() => {
    const defaults = INITIAL_VEGGIES.map((name) => ({ id: uuidv4(), name }));
    setVegetables(defaults);
  }, []);

  useEffect(() => {
    const savedVeggies = localStorage.getItem(STORAGE_KEY_VEGGIES);
    if (savedVeggies) {
      try {
        setVegetables(JSON.parse(savedVeggies));
      } catch {
        loadDefaults();
      }
    } else {
      loadDefaults();
    }

    const savedAllergies = localStorage.getItem(STORAGE_KEY_ALLERGIES);
    if (savedAllergies) {
      try { setAllergies(JSON.parse(savedAllergies)); } catch { /* ignore */ }
    }

    const savedRecipesJson = localStorage.getItem(STORAGE_KEY_RECIPES);
    if (savedRecipesJson) {
      try { setSavedRecipes(JSON.parse(savedRecipesJson)); } catch { /* ignore */ }
    }

    const savedShoppingList = localStorage.getItem(STORAGE_KEY_SHOPPING_LIST);
    if (savedShoppingList) {
      try { setShoppingList(JSON.parse(savedShoppingList)); } catch { /* ignore */ }
    }
  }, [loadDefaults]);

  // -------------------------------------------------------
  // LocalStorage 書き込み
  // -------------------------------------------------------
  useEffect(() => {
    if (vegetables.length > 0) {
      localStorage.setItem(STORAGE_KEY_VEGGIES, JSON.stringify(vegetables));
    }
  }, [vegetables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ALLERGIES, JSON.stringify(allergies));
  }, [allergies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHOPPING_LIST, JSON.stringify(shoppingList));
  }, [shoppingList]);

  // -------------------------------------------------------
  // 野菜ハンドラー
  // -------------------------------------------------------
  const handleAddVegetable = (name: string) => {
    const newVeg: Vegetable = { id: uuidv4(), name };
    setVegetables((prev) => [...prev, newVeg]);
    setSelectedIds((prev) => [...prev, newVeg.id]);
  };

  const handleRemoveVegetable = (id: string) => {
    setVegetables((prev) => prev.filter((v) => v.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const handleToggleVegetable = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // -------------------------------------------------------
  // アレルギーハンドラー
  // -------------------------------------------------------
  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies((prev) => [...prev, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergies((prev) => prev.filter((a) => a !== item));
  };

  // -------------------------------------------------------
  // レシピ生成
  // -------------------------------------------------------
  const handleGenerateRecipe = async () => {
    if (selectedIds.length === 0) {
      setRecipeState((prev) => ({ ...prev, error: '野菜を1つ以上選択してください' }));
      return;
    }

    let finalProtein: string = proteinType;
    if (proteinType === ProteinType.OTHER) {
      if (!customProtein.trim()) {
        setRecipeState((prev) => ({ ...prev, error: 'その他の食材を入力してください' }));
        return;
      }
      finalProtein = `＋${customProtein.trim()}`;
    }

    const selectedVegNames = vegetables
      .filter((v) => selectedIds.includes(v.id))
      .map((v) => v.name);

    setRecipeState({ recipes: [], loading: true, imageLoading: false, error: null });

    try {
      // 農家直伝モードの場合は固定データから返す（AI生成しない）
      if (recipeMood === RecipeMood.FARMER) {
        const matched = findMatchingFarmerRecipes(selectedVegNames, finalProtein);

        if (matched.length === 0) {
          setRecipeState({
            recipes: [],
            loading: false,
            imageLoading: false,
            error: '選択した野菜に合う農家直伝レシピが見つかりませんでした。野菜の選択を変えてみてください。',
          });
          return;
        }

        const converted = matched.map(farmerRecipeToRecipe);
        setRecipeState({
          recipes: converted,
          loading: false,
          imageLoading: false,
          error: null,
        });
        return;
      }

      // 1. テキスト生成（通常のAI生成）
      const recipesData = await generateRecipeText(
        selectedVegNames,
        finalProtein,
        cookingTime,
        recipeMood,
        allergies,
        generationMode
      );

      setRecipeState((prev) => ({
        ...prev,
        loading: false,
        imageLoading: true,
        recipes: recipesData,
      }));

      // 2. 画像生成（並列）
      const recipesWithImages = await Promise.all(
        recipesData.map(async (recipe) => {
          try {
            const base64Image = await generateRecipeImage(recipe);
            return { ...recipe, imageBase64: base64Image };
          } catch (e) {
            console.error(`Image gen failed for ${recipe.title}`, e);
            return recipe;
          }
        })
      );

      setRecipeState((prev) => ({
        ...prev,
        imageLoading: false,
        recipes: recipesWithImages,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
      setRecipeState((prev) => ({
        ...prev,
        loading: false,
        imageLoading: false,
        error: message,
      }));
    }
  };

  // -------------------------------------------------------
  // お気に入りハンドラー
  // -------------------------------------------------------
  const handleToggleFavorite = (recipe: Recipe) => {
    setSavedRecipes((prev) => {
      const isAlreadySaved = prev.some((r) => r.id === recipe.id);
      if (isAlreadySaved) {
        if (window.confirm('お気に入りから削除してもよろしいですか？')) {
          return prev.filter((r) => r.id !== recipe.id);
        }
        return prev;
      }
      return [recipe, ...prev];
    });
  };

  // -------------------------------------------------------
  // 買い物リストハンドラー
  // -------------------------------------------------------
  const handleAddToShoppingList = (ingredients: string[]) => {
    setShoppingList((prev) => [...prev, ...ingredients]);
  };

  const handleRemoveFromShoppingList = (index: number) => {
    setShoppingList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearShoppingList = () => {
    if (window.confirm('買い物リストを全て削除しますか？')) {
      setShoppingList([]);
    }
  };

  // -------------------------------------------------------
  // レンダリング
  // -------------------------------------------------------
  return (
    <div className="min-h-screen pb-24 bg-[#fffdfa] print:bg-white print:pb-0 font-sans">
      <Header
        onNavigate={setCurrentView}
        currentView={currentView}
        favoriteCount={savedRecipes.length}
        shoppingListCount={shoppingList.length}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
        {/* ホームビュー */}
        {currentView === 'home' && (
          <>
            {/* 入力セクション（印刷時非表示） */}
            <div className="print:hidden space-y-5">
              {/* STEP 1: 野菜選択 */}
              <VegetableManager
                vegetables={vegetables}
                selectedIds={selectedIds}
                onAdd={handleAddVegetable}
                onRemove={handleRemoveVegetable}
                onToggle={handleToggleVegetable}
              />

              {/* STEP 2: レシピ設定 */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5">
                <h2 className="text-base font-bold text-stone-700 mb-4 flex items-center gap-2">
                  <span className="bg-pastel-orange text-orange-800 p-1.5 rounded-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                      />
                    </svg>
                  </span>
                  2. レシピの設定
                </h2>

                <div className="space-y-6">
                  {/* タンパク質選択 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">
                      追加食材（タンパク質など）
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {Object.values(ProteinType).map((type) => (
                        <button
                          key={type}
                          onClick={() => setProteinType(type)}
                          className={`
                            px-2 py-2.5 rounded-2xl text-xs font-bold transition-all
                            ${proteinType === type
                              ? 'bg-pastel-green text-green-900 shadow-sm'
                              : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}
                          `}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {proteinType === ProteinType.OTHER && (
                      <div className="mt-3 animate-fade-in-down">
                        <input
                          type="text"
                          value={customProtein}
                          onChange={(e) => setCustomProtein(e.target.value)}
                          placeholder="例: 豆腐, チーズ, ベーコン..."
                          className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pastel-green/50 shadow-sm bg-[#fffcf5] text-sm"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* 調理時間 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">
                      調理時間
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.values(CookingTime).map((time) => (
                        <button
                          key={time}
                          onClick={() => setCookingTime(time)}
                          className={`
                            px-2 py-2.5 rounded-2xl text-xs font-bold transition-all
                            ${cookingTime === time
                              ? 'bg-pastel-blue text-blue-900 shadow-sm'
                              : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 料理の気分 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">
                      料理の系統・気分
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {Object.values(RecipeMood).map((mood) => (
                        <button
                          key={mood}
                          onClick={() => setRecipeMood(mood)}
                          className={`
                            px-2 py-2.5 rounded-2xl text-xs font-bold transition-all
                            ${recipeMood === mood
                              ? 'bg-pastel-yellow text-yellow-900 shadow-sm'
                              : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}
                          `}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 生成モード */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">
                      生成モード
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(GenerationMode).map((mode) => {
                        const descriptions: Record<GenerationMode, string> = {
                          [GenerationMode.SINGLE]: '今夜の一品を',
                          [GenerationMode.TWO_COURSE]: '主菜＋副菜をセットで',
                          [GenerationMode.THREE_DAY_PREP]: '週末にまとめて作るなら',
                          [GenerationMode.THREE_DAY_FULL_PLAN]: '食材を無駄なく使い切る',
                        };
                        return (
                          <button
                            key={mode}
                            onClick={() => setGenerationMode(mode)}
                            className={`
                              p-3 rounded-2xl text-left transition-all
                              ${generationMode === mode
                                ? 'bg-pastel-pink text-pink-900 shadow-sm'
                                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}
                            `}
                          >
                            <div className="font-bold text-xs">{mode}</div>
                            <div
                              className={`text-[10px] mt-0.5 ${generationMode === mode ? 'text-pink-800' : 'text-stone-400'}`}
                            >
                              {descriptions[mode]}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* アレルギー・NG食材 */}
                  <div className="pt-4 border-t border-stone-100">
                    <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                      アレルギー・NG食材
                      <span className="text-[10px] font-normal bg-red-100 text-red-600 px-2 py-0.5 rounded-full normal-case">
                        除外
                      </span>
                    </label>
                    <form onSubmit={handleAddAllergy} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        placeholder="例: そば, エビ, ピーマン..."
                        className="flex-1 min-w-0 px-4 py-2.5 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 bg-[#fffcf5] text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-stone-600 text-white px-4 py-2.5 rounded-xl hover:bg-stone-500 transition-colors text-sm font-bold shrink-0"
                      >
                        登録
                      </button>
                    </form>

                    {allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allergies.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs border border-red-100"
                          >
                            {item}
                            <button
                              onClick={() => handleRemoveAllergy(item)}
                              className="ml-1 hover:text-red-900 font-bold focus:outline-none"
                              aria-label={`${item}を削除`}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400">登録されたNG食材はありません</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 生成ボタン（スティッキー） */}
              <div className="flex justify-center sticky bottom-5 z-40 py-2">
                <button
                  onClick={handleGenerateRecipe}
                  disabled={recipeState.loading || selectedIds.length === 0}
                  className={`
                    w-full max-w-xs py-4 rounded-full text-base font-bold shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 border-4 border-white
                    ${recipeState.loading || selectedIds.length === 0
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : 'bg-pastel-orange text-orange-900 hover:bg-orange-300 hover:shadow-2xl'}
                  `}
                >
                  {recipeState.loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-orange-900"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      レシピを考案中...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                      >
                        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                      </svg>
                      レシピを生成する
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* エラー表示 */}
            {recipeState.error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-5 text-center text-sm print:hidden">
                {recipeState.error}
              </div>
            )}

            {/* レシピ結果 */}
            {recipeState.recipes.length > 0 && (
              <div className="mb-12 print:mb-0 space-y-6">
                <h2 className="text-lg font-bold text-stone-700 flex items-center gap-2 print:hidden">
                  <span className="bg-pastel-yellow text-yellow-800 p-1.5 rounded-xl">🎉</span>
                  提案されたレシピ（{recipeState.recipes.length}品）
                </h2>

                {recipeState.recipes.map((recipe, index) => {
                  const label = getLabelForRecipe(index, generationMode);
                  return (
                    <div key={recipe.id} className="relative">
                      {label && (
                        <div className="absolute -top-3 left-4 z-10 bg-pastel-green text-green-900 text-xs font-bold px-3 py-1 rounded-full shadow-md print:hidden">
                          {label}
                        </div>
                      )}
                      <RecipeCard
                        recipe={recipe}
                        isImageLoading={recipeState.imageLoading}
                        onSave={handleToggleFavorite}
                        isSaved={savedRecipes.some((r) => r.id === recipe.id)}
                        onAddToShoppingList={handleAddToShoppingList}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* お気に入りビュー */}
        {currentView === 'favorites' && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-700 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7 text-pastel-pink"
                >
                  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                </svg>
                お気に入りレシピ
              </h2>
              <button
                onClick={() => setCurrentView('home')}
                className="text-stone-500 hover:text-stone-800 underline text-sm"
              >
                戻る
              </button>
            </div>

            {savedRecipes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-stone-200">
                <p className="text-stone-400 text-base">お気に入りはまだありません</p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="mt-4 text-green-700 font-bold hover:underline text-sm"
                >
                  レシピを作りにいく
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {savedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isImageLoading={false}
                    isSaved={true}
                    onSave={handleToggleFavorite}
                    onAddToShoppingList={handleAddToShoppingList}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 買い物リストビュー */}
        {currentView === 'shoppingList' && (
          <ShoppingList
            items={shoppingList}
            onRemoveItem={handleRemoveFromShoppingList}
            onClearList={handleClearShoppingList}
            onNavigateBack={() => setCurrentView('home')}
          />
        )}
      </main>
    </div>
  );
}
