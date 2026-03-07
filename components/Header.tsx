import React from 'react';

interface HeaderProps {
  onNavigate: (view: 'home' | 'favorites' | 'shoppingList') => void;
  currentView: 'home' | 'favorites' | 'shoppingList';
  favoriteCount: number;
  shoppingListCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, favoriteCount, shoppingListCount }) => {
  return (
    <header className="relative bg-white/80 shadow-sm sticky top-0 z-50 print:hidden overflow-hidden transition-all duration-300 border-b border-stone-100">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=2000" 
          alt="Fresh Vegetables Background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity focus:outline-none group"
        >
          <div className="bg-white/60 p-2 rounded-2xl backdrop-blur-md shadow-sm border border-stone-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7 text-green-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide text-stone-700 drop-shadow-sm">おつかれさまです！ごはん、手伝います！</h1>
        </button>
        
        <div className="flex items-center gap-3">
          {/* Shopping List Button */}
          <button
            onClick={() => onNavigate(currentView === 'shoppingList' ? 'home' : 'shoppingList')}
            className={`
              relative p-2 rounded-2xl transition-all duration-200
              ${currentView === 'shoppingList' 
                ? 'bg-pastel-blue text-blue-900 shadow-md' 
                : 'bg-white/60 text-stone-600 hover:bg-white/80'}
            `}
            title="買い物リストを見る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {shoppingListCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[20px] text-center shadow-sm">
                {shoppingListCount}
              </span>
            )}
          </button>

          {/* Favorites Button */}
          <button
            onClick={() => onNavigate(currentView === 'favorites' ? 'home' : 'favorites')}
            className={`
              relative p-2 rounded-2xl transition-all duration-200
              ${currentView === 'favorites' 
                ? 'bg-pastel-pink text-red-800 shadow-md' 
                : 'bg-white/60 text-stone-600 hover:bg-white/80'}
            `}
            title="お気に入りレシピを見る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            {favoriteCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[20px] text-center shadow-sm">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
