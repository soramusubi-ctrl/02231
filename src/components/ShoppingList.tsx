import React, { useState } from 'react';

interface ShoppingListProps {
  items: string[];
  onRemoveItem: (index: number) => void;
  onClearList: () => void;
  onNavigateBack: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  items,
  onRemoveItem,
  onClearList,
  onNavigateBack,
}) => {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const copyToClipboard = async () => {
    const text = items.map((item, i) => `${checkedItems.includes(i) ? '✓' : '□'} ${item}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      alert('クリップボードにコピーしました！');
    } catch {
      alert('コピーに失敗しました。');
    }
  };

  const checkedCount = checkedItems.length;

  return (
    <div className="animate-fade-in-up">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-stone-700 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7 text-pastel-blue"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
          買い物リスト
          {items.length > 0 && (
            <span className="text-sm font-normal text-stone-400">
              （{checkedCount}/{items.length}）
            </span>
          )}
        </h2>
        <button
          onClick={onNavigateBack}
          className="text-stone-500 hover:text-stone-800 underline text-sm"
        >
          戻る
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
            </div>
            <p className="text-stone-400 font-medium">リストは空です</p>
            <p className="text-stone-400 text-sm mt-1">レシピから材料を追加してね</p>
          </div>
        ) : (
          <div>
            {/* アイテムリスト */}
            <div className="divide-y divide-stone-100">
              {items.map((item, index) => {
                const isChecked = checkedItems.includes(index);
                return (
                  <div
                    key={index}
                    className={`
                      flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors cursor-pointer
                      ${isChecked ? 'bg-stone-50' : ''}
                    `}
                    onClick={() => toggleCheck(index)}
                  >
                    {/* チェックボックス */}
                    <div
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0
                        ${isChecked ? 'bg-pastel-blue border-pastel-blue' : 'border-stone-300'}
                      `}
                    >
                      {isChecked && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-3.5 h-3.5 text-blue-900"
                        >
                          <path
                            fillRule="evenodd"
                            d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    {/* アイテム名 */}
                    <span
                      className={`flex-1 text-sm ${isChecked ? 'text-stone-400 line-through' : 'text-stone-700 font-medium'}`}
                    >
                      {item}
                    </span>

                    {/* 削除ボタン */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(index);
                      }}
                      className="text-stone-300 hover:text-red-400 p-2 rounded-full hover:bg-red-50 transition-colors"
                      aria-label="削除"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* フッターアクション */}
            <div className="bg-stone-50 p-4 border-t border-stone-100 flex justify-between items-center gap-3">
              <button
                onClick={onClearList}
                className="text-stone-500 text-sm hover:text-red-500 font-bold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                全て削除
              </button>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-100 transition-colors"
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
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                  />
                </svg>
                テキストでコピー
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
