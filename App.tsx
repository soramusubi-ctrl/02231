import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Header } from './components/Header';
import { VegetableManager } from './components/VegetableManager';
import { RecipeCard } from './components/RecipeCard';
import { ShoppingList } from './components/ShoppingList';
import { Vegetable, ProteinType, RecipeState, CookingTime, RecipeMood, Recipe, GenerationMode } from './types';
import { generateRecipeText, generateRecipeImage } from './services/geminiService';

const STORAGE_KEY_VEGGIES = 'veggie-chef-vegetables';
const STORAGE_KEY_ALLERGIES = 'veggie-chef-allergies';
const STORAGE_KEY_RECIPES = 'veggie-chef-recipes';
const STORAGE_KEY_SHOPPING_LIST = 'veggie-chef-shopping-list';

// Updated initial list based on user request
const INITIAL_VEGGIES = [
  'トマト', 'ミニトマト', 'カラフルミニトマト', 'じゃがいも', '大根', 'レタス'
];

export default function App() {
  // --- State ---
  const [currentView, setCurrentView] = useState<'home' | 'favorites' | 'shoppingList'>('home');

  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Protein State
  const [proteinType, setProteinType] = useState<ProteinType>(ProteinType.NONE);
  const [customProtein, setCustomProtein] = useState('');

  const [cookingTime, setCookingTime] = useState<CookingTime>(CookingTime.ANY);
  const [recipeMood, setRecipeMood] = useState<RecipeMood>(RecipeMood.ANY);
  
  // New: Generation Mode (Single / 2-Course / 3-Day Prep)
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.SINGLE);
  
  // Allergy State
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const [recipeState, setRecipeState] = useState<RecipeState>({
    recipes: [],
    loading: false,
    imageLoading: false,
    error: null,
  });

  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  // --- Effects ---

  // Load from local storage on mount
  useEffect(() => {
    // Load Veggies
    const savedVeggies = localStorage.getItem(STORAGE_KEY_VEGGIES);
    if (savedVeggies) {
      try {
        setVegetables(JSON.parse(savedVeggies));
      } catch (e) {
        console.error("Failed to parse local storage (veggies)", e);
        loadDefaults();
      }
    } else {
      loadDefaults();
    }

    // Load Allergies
    const savedAllergies = localStorage.getItem(STORAGE_KEY_ALLERGIES);
    if (savedAllergies) {
      try {
        setAllergies(JSON.parse(savedAllergies));
      } catch (e) {
        console.error("Failed to parse local storage (allergies)", e);
      }
    }

    // Load Saved Recipes
    const savedRecipesJson = localStorage.getItem(STORAGE_KEY_RECIPES);
    if (savedRecipesJson) {
      try {
        setSavedRecipes(JSON.parse(savedRecipesJson));
      } catch (e) {
        console.error("Failed to parse local storage (recipes)", e);
      }
    }

    // Load Shopping List
    const savedShoppingList = localStorage.getItem(STORAGE_KEY_SHOPPING_LIST);
    if (savedShoppingList) {
      try {
        setShoppingList(JSON.parse(savedShoppingList));
      } catch (e) {
        console.error("Failed to parse local storage (shopping list)", e);
      }
    }
  }, []);

  // Save to local storage whenever vegetables change
  useEffect(() => {
    if (vegetables.length > 0) {
      localStorage.setItem(STORAGE_KEY_VEGGIES, JSON.stringify(vegetables));
    }
  }, [vegetables]);

  // Save to local storage whenever allergies change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ALLERGIES, JSON.stringify(allergies));
  }, [allergies]);

  // Save to local storage whenever savedRecipes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  // Save to local storage whenever shoppingList changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHOPPING_LIST, JSON.stringify(shoppingList));
  }, [shoppingList]);

  const loadDefaults = useCallback(() => {
    const defaults = INITIAL_VEGGIES.map(name => ({ id: uuidv4(), name }));
    setVegetables(defaults);
  }, []);

  // --- Handlers ---

  const handleAddVegetable = (name: string) => {
    const newVeg = { id: uuidv4(), name };
    setVegetables(prev => [...prev, newVeg]);
    // Auto select the newly added one
    setSelectedIds(prev => [...prev, newVeg.id]);
  };

  const handleRemoveVegetable = (id: string) => {
    setVegetables(prev => prev.filter(v => v.id !== id));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const handleToggleVegetable = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Allergy Handlers
  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies(prev => [...prev, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergies(prev => prev.filter(a => a !== item));
  };

  const handleGenerateRecipe = async () => {
    if (selectedIds.length === 0) {
      setRecipeState(prev => ({ ...prev, error: "野菜を1つ以上選択してください" }));
      return;
    }

    // Validate protein selection
    let finalProtein: string = proteinType;
    if (proteinType === ProteinType.OTHER) {
      if (!customProtein.trim()) {
        setRecipeState(prev => ({ ...prev, error: "その他の食材を入力してください" }));
        return;
      }
      finalProtein = `＋${customProtein.trim()}`;
    }

    const selectedVegNames = vegetables
      .filter(v => selectedIds.includes(v.id))
      .map(v => v.name);

    setRecipeState({
      recipes: [],
      loading: true,
      imageLoading: false,
      error: null,
    });

    try {
      // 1. Generate Text (Returns Array)
      const recipesData = await generateRecipeText(
        selectedVegNames, 
        finalProtein, 
        cookingTime, 
        recipeMood, 
        allergies,
        generationMode
      );
      
      setRecipeState(prev => ({
        ...prev,
        loading: false,
        imageLoading: true,
        recipes: recipesData
      }));

      // 2. Generate Images for ALL recipes (Async/Parallel)
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
      
      setRecipeState(prev => ({
        ...prev,
        imageLoading: false,
        recipes: recipesWithImages
      }));

    } catch (error: any) {
      setRecipeState(prev => ({
        ...prev,
        loading: false,
        imageLoading: false,
        error: error.message || "予期せぬエラーが発生しました"
      }));
    }
  };

  const handleToggleFavorite = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const isAlreadySaved = prev.some(r => r.id === recipe.id);
      if (isAlreadySaved) {
        if (window.confirm('お気に入りから削除してもよろしいですか？')) {
           return prev.filter(r => r.id !== recipe.id);
        }
        return prev;
      } else {
        return [recipe, ...prev];
      }
    });
  };

  // Shopping List Handlers
  const handleAddToShoppingList = (ingredients: string[]) => {
    setShoppingList(prev => [...prev, ...ingredients]);
  };

  const handleRemoveFromShoppingList = (index: number) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearShoppingList = () => {
    if (window.confirm('買い物リストを全て削除しますか？')) {
      setShoppingList([]);
    }
  };

  const getLabelForRecipe = (index: number) => {
    if (generationMode === GenerationMode.TWO_COURSE) {
      return index === 0 ? '一品目（主菜）' : '二品目（副菜）';
    }
    if (generationMode === GenerationMode.THREE_DAY_PREP) {
      return `作り置き ${index + 1}品目`;
    }
    if (generationMode === GenerationMode.THREE_DAY_FULL_PLAN) {
      // Logic relies on 3 items per day (Breakfast, Dinner Main, Dinner Side)
      const day = Math.floor(index / 3) + 1;
      const typeIndex = index % 3;
      
      let typeLabel = '';
      if (typeIndex === 0) typeLabel = '朝食';
      else if (typeIndex === 1) typeLabel = '夕食（主菜）';
      else if (typeIndex === 2) typeLabel = '夕食（副菜）';

      return `${day}日目 ${typeLabel}`;
    }
    return '';
  };

  return (
    <div className="min-h-screen pb-20 bg-[#fffdfa] print:bg-white print:pb-0 font-sans">
      <Header 
        onNavigate={setCurrentView} 
        currentView={currentView}
        favoriteCount={savedRecipes.length}
        shoppingListCount={shoppingList.length}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        
        {currentView === 'home' && (
          <>
            {/* Input Section - Hidden on Print */}
            <div className="print:hidden">
              {/* Step 1: Manage & Select Ingredients */}
              <VegetableManager
                vegetables={vegetables}
                selectedIds={selectedIds}
                onAdd={handleAddVegetable}
                onRemove={handleRemoveVegetable}
                onToggle={handleToggleVegetable}
              />

              {/* Step 2: Configure Settings */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 mb-8">
                 <h2 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
                  <span className="bg-pastel-orange text-orange-800 p-1.5 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                  </span>
                   2. レシピの設定
                </h2>
                
                <div className="space-y-8">
                  {/* Protein Type Selection */}
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-2">追加食材（タンパク質など）</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {Object.values(ProteinType).map((type) => (
                          <button
                            key={type}
                            onClick={() => setProteinType(type)}
                            className={`
                              px-2 py-3 rounded-2xl border-none text-sm font-bold transition-all
                              ${proteinType === type 
                                ? 'bg-pastel-green text-green-900 shadow-sm' 
                                : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}
                            `}
                          >
                            {type.split(' ')[0]}
                          </button>
                      ))}
                    </div>
                    
                    {/* Custom Protein Input */}
                    {proteinType === ProteinType.OTHER && (
                      <div className="mt-3 animate-fade-in-down">
                        <input
                          type="text"
                          value={customProtein}
                          onChange={(e) => setCustomProtein(e.target.value)}
                          placeholder="例: 豆腐, チーズ, ベーコン, ツナ缶..."
                          className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pastel-green/50 shadow-sm bg-[#fffcf5]"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* Recipe Mood Selection */}
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-2">料理の系統・気分</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {Object.values(RecipeMood).map((mood) => (
                          <button
                            key={mood}
                            onClick={() => setRecipeMood(mood)}
                            className={`
                              px-3 py-3 rounded-2xl border-none text-sm font-bold transition-all whitespace-nowrap
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

                  {/* Cooking Time Selection */}
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-2">調理時間（目安）</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.values(CookingTime).map((time) => (
                          <button
                            key={time}
                            onClick={() => setCookingTime(time)}
                            className={`
                              px-4 py-3 rounded-2xl border-none text-sm font-bold transition-all
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

                  {/* Generation Mode (Single / 2-Course / 3-Day Prep / 3-Day Full) */}
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-2">提案モード</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => setGenerationMode(GenerationMode.SINGLE)}
                        className={`
                          p-4 rounded-2xl border-none text-left transition-all relative overflow-hidden
                          ${generationMode === GenerationMode.SINGLE
                            ? 'bg-pastel-pink text-pink-900 shadow-sm'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}
                        `}
                      >
                         <div className="font-bold">1品提案</div>
                         <div className={`text-xs mt-1 ${generationMode === GenerationMode.SINGLE ? 'text-pink-800' : 'text-stone-400'}`}>手軽に一品作りたい時に</div>
                      </button>

                      <button
                        onClick={() => setGenerationMode(GenerationMode.TWO_COURSE)}
                        className={`
                          p-4 rounded-2xl border-none text-left transition-all relative overflow-hidden
                          ${generationMode === GenerationMode.TWO_COURSE
                             ? 'bg-pastel-pink text-pink-900 shadow-sm'
                             : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}
                        `}
                      >
                         <div className="font-bold">2品献立 (主菜+副菜)</div>
                         <div className={`text-xs mt-1 ${generationMode === GenerationMode.TWO_COURSE ? 'text-pink-800' : 'text-stone-400'}`}>今夜の晩ごはんをセットで</div>
                      </button>

                      <button
                        onClick={() => setGenerationMode(GenerationMode.THREE_DAY_PREP)}
                        className={`
                          p-4 rounded-2xl border-none text-left transition-all relative overflow-hidden
                          ${generationMode === GenerationMode.THREE_DAY_PREP
                             ? 'bg-pastel-pink text-pink-900 shadow-sm'
                             : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}
                        `}
                      >
                         <div className="font-bold">3日分作り置き</div>
                         <div className={`text-xs mt-1 ${generationMode === GenerationMode.THREE_DAY_PREP ? 'text-pink-800' : 'text-stone-400'}`}>週末にまとめて作るなら</div>
                      </button>

                      <button
                        onClick={() => setGenerationMode(GenerationMode.THREE_DAY_FULL_PLAN)}
                        className={`
                          p-4 rounded-2xl border-none text-left transition-all relative overflow-hidden
                          ${generationMode === GenerationMode.THREE_DAY_FULL_PLAN
                             ? 'bg-pastel-pink text-pink-900 shadow-sm'
                             : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}
                        `}
                      >
                         <div className="font-bold">3日分献立 (朝+夕)</div>
                         <div className={`text-xs mt-1 ${generationMode === GenerationMode.THREE_DAY_FULL_PLAN ? 'text-pink-800' : 'text-stone-400'}`}>食材使い回しで無駄なく</div>
                      </button>
                    </div>
                  </div>

                  {/* Allergy / NG Ingredients */}
                  <div className="pt-4 border-t border-stone-100">
                     <label className="block text-sm font-bold text-stone-500 mb-2 flex items-center gap-2">
                      <span>アレルギー・苦手な食材（NG食材）</span>
                      <span className="text-xs font-normal bg-red-100 text-red-600 px-2 py-0.5 rounded-full">除外</span>
                     </label>
                     <div className="flex flex-col sm:flex-row gap-2 mb-3">
                       <form onSubmit={handleAddAllergy} className="flex-1 flex gap-2">
                         <input
                           type="text"
                           value={allergyInput}
                           onChange={(e) => setAllergyInput(e.target.value)}
                           placeholder="例: そば, エビ, ピーマン..."
                           className="flex-1 px-4 py-2 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 bg-[#fffcf5]"
                         />
                         <button
                           type="submit"
                           className="bg-stone-600 text-white px-4 py-2 rounded-xl hover:bg-stone-500 transition-colors text-sm font-bold"
                         >
                           登録
                         </button>
                       </form>
                     </div>
                     
                     {allergies.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                         {allergies.map((item, index) => (
                           <span key={index} className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm border border-red-100">
                             {item}
                             <button onClick={() => handleRemoveAllergy(item)} className="ml-1 hover:text-red-900 font-bold focus:outline-none">
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

              {/* Action Button */}
              <div className="flex justify-center mb-10 sticky bottom-6 z-40">
                 <button
                  onClick={handleGenerateRecipe}
                  disabled={recipeState.loading || selectedIds.length === 0}
                  className={`
                    w-full max-w-sm py-4 rounded-full text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 border-4 border-white
                    ${recipeState.loading || selectedIds.length === 0
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : 'bg-pastel-orange text-orange-900 hover:bg-orange-300 hover:shadow-2xl'
                    }
                  `}
                 >
                  {recipeState.loading ? (
                    <>
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      レシピを考案中...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"></path>
                      </svg>
                      <span>レシピを生成する</span>
                    </>
                  )}
                 </button>
              </div>
            </div>

            {/* Results */}
            {recipeState.error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-center print:hidden">
                {recipeState.error}
              </div>
            )}

            {recipeState.recipes.length > 0 && (
              <div className="mb-12 print:mb-0">
                <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2 print:hidden">
                  <span className="bg-pastel-yellow text-yellow-800 p-1.5 rounded-xl">
                    🎉
                  </span>
                  提案されたレシピ ({recipeState.recipes.length}品)
                </h2>
                <div className="grid gap-8">
                  {recipeState.recipes.map((recipe, index) => {
                    const label = getLabelForRecipe(index);
                    return (
                      <div key={recipe.id} className="relative">
                         {/* Label for Multi-dish */}
                         {label && (
                           <div className="absolute -top-3 left-4 z-10 bg-pastel-green text-green-900 text-xs font-bold px-3 py-1 rounded-full shadow-md print:hidden">
                             {label}
                           </div>
                         )}
                         <RecipeCard 
                          recipe={recipe} 
                          isImageLoading={recipeState.imageLoading}
                          onSave={handleToggleFavorite}
                          isSaved={savedRecipes.some(r => r.id === recipe.id)}
                          onAddToShoppingList={handleAddToShoppingList}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        
        {currentView === 'favorites' && (
          /* Favorites View */
          <div className="animate-fade-in-up">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pastel-pink">
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
               <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
                 <p className="text-stone-400 text-lg">お気に入りはまだありません</p>
                 <button onClick={() => setCurrentView('home')} className="mt-4 text-green-700 font-bold hover:underline">
                   レシピを作りにいく
                 </button>
               </div>
             ) : (
               <div className="space-y-12">
                 {savedRecipes.map(recipe => (
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
