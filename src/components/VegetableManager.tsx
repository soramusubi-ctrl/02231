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
  if (n.includes('玉ねぎ') || n.includes('ねぎ') || n.includes('onion')) return '🧅';
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
  if (n.includes('ほうれん草') || n.includes('spinach')) return '🌿';
  if (n.includes('ごぼう') || n.includes('burdock')) return '🪵';
  if (n.includes('れんこん') || n.includes('lotus')) return '🌸';
  if (n.includes('もやし') || n.includes('sprout')) return '🌱';
  if (n.includes('大根') || n.includes('daikon')) return '🥕';
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
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
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
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('カメラへのアクセスに失敗しました:', err);
        alert('カメラへのアクセスが許可されていません。');
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const identified = await identifyVegetables(base64Image);
      if (identified.length > 0) {
        identified.forEach((name) => {
          if (!vegetables.some((v) => v.name === name)) {
            onAdd(name);
          }
        });
        closeCamera();
      } else {
        alert('野菜が見つかりませんでした。もう一度試してください。');
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('野菜認識エラー:', error);
      alert('野菜の認識に失敗しました。');
      setIsAnalyzing(false);
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-5">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-stone-700 flex items-center gap-2">
            <span className="bg-pastel-green text-green-900 p-1.5 rounded-xl">
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
                  d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
              </svg>
            </span>
            1. 野菜を選ぶ
          </h2>
          {selectedCount > 0 && (
            <span className="text-xs bg-pastel-green text-green-900 font-bold px-2.5 py-1 rounded-full">
              {selectedCount}個選択中
            </span>
          )}
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="野菜名を入力（例：ほうれん草）"
            className="flex-1 min-w-0 px-4 py-3 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pastel-green/50 shadow-sm bg-[#fffcf5] text-sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-pastel-green text-green-900 px-4 py-3 rounded-2xl font-bold text-sm hover:bg-green-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            追加
          </button>
          {/* カメラボタン */}
          <button
            type="button"
            onClick={startCamera}
            className="bg-stone-100 text-stone-600 p-3 rounded-2xl hover:bg-stone-200 transition-colors shrink-0"
            title="カメラで野菜を認識"
            aria-label="カメラで野菜を認識"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
          </button>
        </form>

        {/* 野菜グリッド */}
        {vegetables.length === 0 ? (
          <div className="text-center py-10 text-stone-400">
            <p className="text-sm">野菜を追加してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {vegetables.map((veg) => {
              const isSelected = selectedIds.includes(veg.id);
              return (
                <div
                  key={veg.id}
                  onClick={() => onToggle(veg.id)}
                  className={`
                    relative p-2.5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center gap-1 min-h-[90px] group
                    ${isSelected
                      ? 'bg-pastel-green text-green-900 shadow-sm scale-[1.02]'
                      : 'bg-white border-2 border-stone-100 hover:border-pastel-green hover:shadow-md'}
                  `}
                >
                  {/* 選択インジケーター */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 text-green-700 bg-white/50 rounded-full p-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}

                  {/* 絵文字 */}
                  <span className="text-3xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-200">
                    {getVegetableEmoji(veg.name)}
                  </span>

                  {/* 野菜名 */}
                  <span
                    className={`font-bold text-xs leading-tight ${isSelected ? 'text-green-900' : 'text-stone-600'}`}
                  >
                    {veg.name}
                  </span>

                  {/* 削除ボタン */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(veg.id);
                    }}
                    className={`
                      absolute top-1.5 left-1.5 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100
                      ${isSelected
                        ? 'text-green-800 hover:bg-white/30'
                        : 'text-stone-300 hover:text-red-400 hover:bg-red-50'}
                    `}
                    title="削除"
                    aria-label={`${veg.name}を削除`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3 h-3"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* カメラモーダル */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-black rounded-3xl overflow-hidden shadow-2xl border border-stone-700">
            {/* ヘッダー */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-white font-medium text-sm drop-shadow-md">
                野菜を撮影してね
              </span>
              <button
                onClick={closeCamera}
                className="text-white p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors"
                aria-label="カメラを閉じる"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ビデオフィード */}
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
                  <div className="w-10 h-10 border-4 border-pastel-green border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-white font-bold text-sm animate-pulse">
                    野菜を見ているよ...
                  </p>
                </div>
              )}
            </div>

            {/* シャッターボタン */}
            <div className="p-6 bg-stone-900 flex justify-center">
              <button
                onClick={captureAndIdentify}
                disabled={isAnalyzing}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group focus:outline-none hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
                aria-label="撮影する"
              >
                <div className="w-12 h-12 bg-white rounded-full group-hover:bg-pastel-green transition-colors group-active:scale-90 duration-150" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
