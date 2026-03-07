# おつかれさまです！ごはん、手伝います！

> 手元の野菜から献立を考えてくれる AI アシスタント。  
> Gemini API を使ったレシピ生成・画像生成・野菜カメラ認識に対応しています。

---

## 機能一覧

| 機能 | 説明 |
|---|---|
| 野菜選択 | 手持ちの野菜をタップして選択 |
| カメラ認識 | スマホカメラで野菜を撮影して自動追加 |
| レシピ生成 | 1品・2品献立・3日分作り置き・3日分献立から選択 |
| 画像生成 | レシピごとに AI が料理写真を生成 |
| お気に入り | レシピを保存（LocalStorage） |
| 買い物リスト | 材料をリストに追加・チェック・コピー |
| A4 印刷 | レシピカードを A4 用紙に印刷 |

---

## 技術スタック

- **React 19** + **TypeScript**
- **Vite 6** (バンドラー)
- **TailwindCSS 3** (スタイリング)
- **Google Gemini API** (`gemini-2.5-flash` / `gemini-2.5-flash-preview-04-17`)

---

## ローカル開発

### 前提条件

- Node.js 18 以上
- Google Gemini API キー（[Google AI Studio](https://ai.google.dev/) で取得）

### セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/soramusubi-ctrl/02231.git
cd 02231

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数ファイルを作成
cp .env.local.example .env.local
# .env.local を編集して VITE_GEMINI_API_KEY に API キーを設定

# 4. 開発サーバーを起動
npm run dev
# → http://localhost:3000 でアクセス
```

### ビルド

```bash
npm run build
# → dist/ ディレクトリに出力されます
```

---

## Vercel へのデプロイ

### 方法 1: Vercel ダッシュボードから（推奨）

1. [vercel.com](https://vercel.com) にログイン
2. **Add New Project** → **Import Git Repository** で `soramusubi-ctrl/02231` を選択
3. **Framework Preset**: `Vite` を選択（自動検出される場合が多い）
4. **Build & Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables** に以下を追加:
   ```
   VITE_GEMINI_API_KEY = あなたの Gemini API キー
   ```
6. **Deploy** をクリック

### 方法 2: Vercel CLI から

```bash
# Vercel CLI をインストール（未インストールの場合）
npm install -g vercel

# プロジェクトルートで実行
vercel

# 環境変数を設定
vercel env add VITE_GEMINI_API_KEY

# 本番デプロイ
vercel --prod
```

---

## 環境変数

| 変数名 | 説明 | 必須 |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Google Gemini API キー | ✅ |

> **注意**: `VITE_` プレフィックスが必要です。Vite はこのプレフィックスがある変数のみクライアントサイドに公開します。

---

## プロジェクト構造

```
.
├── src/
│   ├── main.tsx              # エントリーポイント
│   ├── App.tsx               # メインアプリ
│   ├── types.ts              # 型定義
│   ├── index.css             # グローバルスタイル（TailwindCSS + 印刷CSS）
│   ├── components/
│   │   ├── Header.tsx        # ヘッダー・ナビゲーション
│   │   ├── VegetableManager.tsx  # 野菜選択・カメラ認識
│   │   ├── RecipeCard.tsx    # レシピカード（印刷対応）
│   │   └── ShoppingList.tsx  # 買い物リスト
│   └── services/
│       └── geminiService.ts  # Gemini API 連携
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vercel.json               # Vercel SPA 設定
└── .env.local.example        # 環境変数サンプル
```

---

## 印刷について

レシピカードの「印刷（A4）」ボタンを押すと、ブラウザの印刷ダイアログが開きます。

- **用紙サイズ**: A4 縦向き
- **余白**: 上下 15mm / 左右 12mm
- **印刷範囲**: レシピカード（材料・手順・使い回しポイント）のみ
- ヘッダー・ボタン類は自動的に非表示になります

---

## ライセンス

Private
