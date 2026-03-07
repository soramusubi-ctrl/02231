import React, { useState } from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  isImageLoading: boolean;
  onSave?: (recipe: Recipe) => void;
  onAddToShoppingList?: (ingredients: string[]) => void;
  isSaved?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  isImageLoading, 
  onSave, 
  onAddToShoppingList,
  isSaved = false 
}) => {
  const [isAddedToList, setIsAddedToList] = useState(false);

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    const btn = e.currentTarget as HTMLButtonElement;
    btn.blur();
    
    // Ensure window has focus for the print dialog to appear
    window.focus();
    
    // Use timeout to allow UI to settle (e.g. ripple effects)
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleAddToList = () => {
    if (onAddToShoppingList) {
      onAddToShoppingList(recipe.ingredients);
      setIsAddedToList(true);
      setTimeout(() => setIsAddedToList(false), 2000); // Reset feedback after 2s
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-stone-100 animate-fade-in-up print:shadow-none print:border-none print:animate-none print:overflow-visible print:break-inside-avoid">
      {/* Image Section */}
      <div className="relative w-full h-64 md:h-80 bg-stone-100 print:h-64">
        {recipe.imageBase64 ? (
          <img 
            src={recipe.imageBase64} 
            alt={recipe.title} 
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-500">
            {isImageLoading ? (
              <>
                <div className="w-10 h-10 border-4 border-pastel-green border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-sm font-medium animate-pulse">美味しい料理の絵を描いています...</span>
              </>
            ) : (
               <span>画像生成エラー</span>
            )}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-20 print:bg-none print:text-black">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md print:text-black print:drop-shadow-none">{recipe.title}</h2>
        </div>
      </div>

      <div className="p-6 md:p-8">
        
        {/* Reuse Tip / Point Section */}
        {recipe.reuseTip && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-[#fffcf5] border-l-4 border-pastel-green p-4 rounded-r-xl shadow-sm print:bg-none print:border-stone-300">
            <h3 className="text-green-800 font-bold flex items-center gap-2 mb-1.5 text-sm md:text-base print:text-black">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
              </svg>
              使い回し & 美味しさのポイント
            </h3>
            <p className="text-stone-700 text-sm md:text-base leading-relaxed print:text-black">
              {recipe.reuseTip}
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2 print:text-black print:border-stone-300">
              <span className="bg-pastel-green text-green-900 p-1 rounded-lg print:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </span>
              材料 (2人分)
            </h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-stone-700 bg-[#fffcf5] p-2 rounded-lg print:bg-white print:p-0 print:text-black">
                  <span className="w-1.5 h-1.5 bg-pastel-green rounded-full mt-2 shrink-0 print:bg-black"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2 print:text-black print:border-stone-300">
               <span className="bg-pastel-orange text-orange-900 p-1 rounded-lg print:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </span>
              作り方
            </h3>
            <ol className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 bg-stone-700 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm print:bg-transparent print:text-black print:border print:border-black">
                    {index + 1}
                  </div>
                  <p className="text-stone-700 pt-0.5 leading-relaxed print:text-black">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row justify-center items-center pt-4 border-t border-stone-100 gap-3 print:hidden">
          {onSave && (
            <button
              onClick={() => onSave(recipe)}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-200
                ${isSaved 
                  ? 'bg-pastel-pink text-pink-900 border-2 border-pink-200' 
                  : 'bg-white border-2 border-stone-100 text-stone-600 hover:bg-pastel-pink hover:border-pastel-pink hover:text-pink-900 shadow-sm'}
              `}
            >
              {isSaved ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                  </svg>
                  お気に入り済み
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  お気に入り
                </>
              )}
            </button>
          )}

          {onAddToShoppingList && (
            <button
              onClick={handleAddToList}
              disabled={isAddedToList}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm border-2
                ${isAddedToList
                  ? 'bg-pastel-blue text-blue-900 border-blue-200'
                  : 'bg-white border-stone-100 text-stone-600 hover:bg-pastel-blue hover:border-pastel-blue hover:text-blue-900'}
              `}
            >
              {isAddedToList ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  追加しました
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  買い物リスト
                </>
              )}
            </button>
          )}

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015-1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008h-.008V10.5Zm-3 0h.008v.008h-.008V10.5Z" />
            </svg>
            印刷
          </button>
        </div>
      </div>
    </div>
  );
};