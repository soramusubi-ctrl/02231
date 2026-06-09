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
  isSaved = false,
}) => {
  const [isAddedToList, setIsAddedToList] = useState(false);

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLButtonElement).blur();
    window.focus();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleAddToList = () => {
    if (onAddToShoppingList) {
      onAddToShoppingList(recipe.ingredients);
      setIsAddedToList(true);
      setTimeout(() => setIsAddedToList(false), 2000);
    }
  };

  return (
    <div className="recipe-card bg-white rounded-3xl shadow-lg overflow-hidden border border-stone-100 animate-fade-in-up print:shadow-none print:border print:border-stone-300 print:animate-none print:overflow-visible print:break-inside-avoid">
      {/* 画像セクション */}
      <div className="recipe-card-image relative w-full h-56 sm:h-64 bg-stone-100 print:h-48">
        {recipe.imageBase64 ? (
          <img
            src={recipe.imageBase64}
            alt={recipe.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
            {isImageLoading ? (
              <>
                <div className="w-8 h-8 border-4 border-pastel-green border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-medium animate-pulse">
                  料理の絵を描いています...
                </span>
              </>
            ) : (
              <span className="text-sm font-medium">画像生成エラー</span>
            )}
          </div>
        )}

        {/* タイトルオーバーレイ */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-16 print:hidden">
          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
            {recipe.title}
          </h2>
        </div>
      </div>

      {/* 印刷用タイトル（画面では非表示） */}
      <div className="hidden print:block px-6 pt-4 pb-2">
        <h2 className="recipe-card-title text-2xl font-bold text-stone-800 border-b-2 border-stone-300 pb-2">
          {recipe.title}
        </h2>
      </div>

      <div className="p-5 sm:p-6">
        {/* 使い回し・ポイントセクション */}
        {recipe.reuseTip && (
          <div className="recipe-reuse-tip mb-5 bg-gradient-to-r from-green-50 to-[#fffcf5] border-l-4 border-pastel-green p-4 rounded-r-xl shadow-sm print:bg-stone-50 print:border-stone-400">
            <h3 className="text-green-800 font-bold flex items-center gap-2 mb-1.5 text-sm print:text-stone-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                  clipRule="evenodd"
                />
              </svg>
              使い回し &amp; 美味しさのポイント
            </h3>
            <p className="text-stone-700 text-sm leading-relaxed print:text-stone-800">
              {recipe.reuseTip}
            </p>
          </div>
        )}

        {/* 材料・手順グリッド */}
        <div className="grid sm:grid-cols-2 gap-6 mb-5">
          {/* 材料 */}
          <div>
            <h3 className="recipe-section-title text-base font-bold text-stone-700 mb-3 flex items-center gap-2 border-b border-stone-100 pb-2 print:text-stone-800 print:border-stone-300">
              <span className="bg-pastel-green text-green-900 p-1 rounded-lg print:hidden">
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
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </span>
              材料（2人分）
            </h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((item, index) => (
                <li
                  key={index}
                  className="recipe-ingredient-item flex items-start gap-2 text-stone-700 bg-[#fffcf5] p-2 rounded-lg text-sm print:bg-white print:p-0 print:text-stone-800"
                >
                  <span className="text-pastel-green font-bold mt-0.5 print:hidden">•</span>
                  <span className="print:before:content-['・']">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 手順 */}
          <div>
            <h3 className="recipe-section-title text-base font-bold text-stone-700 mb-3 flex items-center gap-2 border-b border-stone-100 pb-2 print:text-stone-800 print:border-stone-300">
              <span className="bg-pastel-orange text-orange-900 p-1 rounded-lg print:hidden">
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
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                  />
                </svg>
              </span>
              作り方
            </h3>
            <ol className="space-y-3">
              {recipe.instructions.map((step, index) => (
                <li
                  key={index}
                  className="recipe-step-item flex items-start gap-3 text-sm print:text-stone-800"
                >
                  <div className="w-6 h-6 rounded-full bg-pastel-orange text-orange-900 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 print:bg-stone-200 print:text-stone-800 print:border print:border-stone-400">
                    {index + 1}
                  </div>
                  <p className="text-stone-700 pt-0.5 leading-relaxed print:text-stone-800">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* アクションフッター（印刷時非表示） */}
        <div className="flex flex-col sm:flex-row justify-center items-center pt-4 border-t border-stone-100 gap-2.5 print:hidden">
          {onSave && (
            <button
              onClick={() => onSave(recipe)}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200
                ${isSaved
                  ? 'bg-pastel-pink text-pink-900 border-2 border-pink-200'
                  : 'bg-white border-2 border-stone-100 text-stone-600 hover:bg-pastel-pink hover:border-pastel-pink hover:text-pink-900 shadow-sm'}
              `}
            >
              {isSaved ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                  </svg>
                  お気に入り済み
                </>
              ) : (
                <>
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
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                    />
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
                w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm border-2
                ${isAddedToList
                  ? 'bg-pastel-blue text-blue-900 border-blue-200'
                  : 'bg-white border-stone-100 text-stone-600 hover:bg-pastel-blue hover:border-pastel-blue hover:text-blue-900'}
              `}
            >
              {isAddedToList ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  追加しました
                </>
              ) : (
                <>
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
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                    />
                  </svg>
                  買い物リストへ
                </>
              )}
            </button>
          )}

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all shadow-sm"
          >
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
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015-1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008h-.008V10.5Zm-3 0h.008v.008h-.008V10.5Z"
              />
            </svg>
            印刷（A4）
          </button>
        </div>
      </div>
    </div>
  );
};
