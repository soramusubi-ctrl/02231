import React, { useState, useRef, useEffect } from 'react';
import { Vegetable } from '../types';
import { identifyVegetables } from '../services/geminiService';

interface VegetableManagerProps {
  vegetables: Vegetable[];
  selectedIds: string[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

const getVegetableEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('玉ねぎ') || n.includes('ネギ') || n.includes('onion')) return '🧅';
  if (n.includes('にんじん') || n.includes('人参') || n.includes('carrot')) return '🥕';
  if (n.includes('じゃがいも') || n.includes('ポテト') || n.includes('potato')) return '🥔';
  if (n.includes('キャベツ') || n.includes('レタス') || n.includes('白菜') || n.includes('cabbage')) return '🥬';
  if (n.includes('トマト') || n.includes('tomato')) return '🍅';
  if (n.includes('きゅうり') || n.includes('cucumber')) return '🥒';
  if (n.includes('ナス') || n.includes('なす') || n.includes('eggplant')) return '🍆';
  if (n.includes('コーン') || n.includes('とうもろこし') || n.includes('corn')) return '🌽';
  if (n.includes('ブロッコリー') || n.includes('broccoli')) return '🥦';
  if (n.includes('ピーマン') || n.includes('パプリカ') || n.includes('pepper')) return '🫑';
  if (n.includes('きのこ') || n.includes('しめじ') || n.includes('椎茸') || n.includes('mushroom')) return '🍄';
  if (n.includes('かぼちゃ') || n.includes('pumpkin')) return '🎃';
  if (n.includes('さつまいも') || n.includes('sweet potato')) return '🍠';
  if (n.includes('アボカド') || n.includes('avocado')) return '🥑';
  if (n.includes('にんにく') || n.includes('garlic')) return '🧄';
  if (n.includes('唐辛子') || n.includes('chili')) return '🌶️';
  return '🥗';
};

export const VegetableManager: React.FC<VegetableManagerProps> = ({
  vegetables,
  selectedIds,
  onAdd,
  onRemove,
  onToggle,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Cleanup stream when component unmounts or camera closes
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("カメラを起動できませんでした。権限を確認してください。");
        setIsCameraOpen(false);
      }
    }, 100);
  };

  const closeCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setIsAnalyzing(false);
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      try {
        const identified = await identifyVegetables(dataUrl);
        if (identified.length > 0) {
          identified.forEach(name => onAdd(name));
          closeCamera();
        } else {
          alert("野菜を認識できませんでした。もう一度試してください。");
          setIsAnalyzing(false); 
        }
      } catch (e) {
        console.error(e);
        alert("画像の解析中にエラーが発生しました。");
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
             <div>
                <h2 className="text-xl font-bold text-stone-700 flex items-center gap-2">
                <span className="bg-pastel-green text-green-800 p-1.5 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                </span>
                1. お野菜を選んでください
                </h2>
                <p className="text-stone-500 text-sm mt-1 ml-1">
                手元にある野菜をタップしてね
                </p>
             </div>
        </div>

        {/* Input & Actions */}
        <div className="bg-[#fffcf5] p-5 rounded-2xl mb-6 border border-stone-100">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">新しい野菜を追加</label>
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                    placeholder="例: パプリカ"
                    className="w-full pl-5 pr-14 py-3 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pastel-green/50 shadow-sm transition-all bg-white"
                    />
                     <button
                        onClick={() => handleAdd()}
                        disabled={!inputValue.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-pastel-green text-green-900 p-2 rounded-xl hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
                
                <button
                    onClick={startCamera}
                    className="bg-pastel-blue text-blue-900 px-5 py-3 rounded-2xl hover:bg-blue-300 transition-all flex items-center gap-2 shadow-sm font-bold whitespace-nowrap"
                    title="カメラでスキャン"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <span className="hidden sm:inline">カメラ</span>
                </button>
            </div>
        </div>

        {/* Veggie Grid */}
        {vegetables.length === 0 ? (
          <div className="text-center py-12 bg-[#fffcf5] rounded-3xl border-2 border-dashed border-stone-200">
            <p className="text-stone-400 font-medium">登録されている野菜はありません</p>
            <p className="text-stone-400 text-sm mt-1">上のフォームから追加してね</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {vegetables.map((veg) => {
              const isSelected = selectedIds.includes(veg.id);
              return (
                <div
                  key={veg.id}
                  onClick={() => onToggle(veg.id)}
                  className={`
                    group relative p-3 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center gap-1 min-h-[110px]
                    ${isSelected 
                      ? 'bg-pastel-green text-green-900 shadow-sm scale-[1.02]' 
                      : 'bg-white border-2 border-stone-100 hover:border-pastel-green hover:shadow-md'}
                  `}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                     <div className="absolute top-2 right-2 text-green-700 bg-white/50 rounded-full p-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                     </div>
                  )}

                  {/* Icon/Avatar Placeholder */}
                   <span className="text-4xl mb-2 filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-200">
                        {getVegetableEmoji(veg.name)}
                   </span>

                  <span className={`font-bold text-sm ${isSelected ? 'text-green-900' : 'text-stone-600'}`}>
                    {veg.name}
                  </span>
                  
                  {/* Remove Button */}
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(veg.id);
                    }}
                    className={`
                        absolute top-2 left-2 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100
                        ${isSelected ? 'text-green-800 hover:bg-white/30' : 'text-stone-300 hover:text-red-400 hover:bg-red-50'}
                    `}
                    title="削除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-black rounded-3xl overflow-hidden shadow-2xl border border-stone-700">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-white font-medium drop-shadow-md">野菜を撮影してね</span>
              <button 
                onClick={closeCamera}
                className="text-white p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Feed */}
            <div className="relative aspect-[3/4] w-full bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-pastel-green border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white font-bold animate-pulse">野菜を見ているよ...</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-8 bg-stone-900 flex justify-center">
              <button
                onClick={captureAndIdentify}
                disabled={isAnalyzing}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group focus:outline-none hover:scale-105 transition-transform shadow-lg"
              >
                <div className="w-16 h-16 bg-white rounded-full group-hover:bg-pastel-green transition-colors group-active:scale-90 duration-150"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}