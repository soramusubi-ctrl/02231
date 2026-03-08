/**
 * 農家直伝レシピ データファイル
 * ============================================================
 * ■ レシピの追加方法
 *   farmerRecipes 配列に新しいオブジェクトを追加するだけです。
 *   必須フィールド: id, title, vegetables, category, ingredients, steps, description
 *   任意フィールド: protein, tags
 *
 * ■ id の命名規則
 *   "farmer-" + 連番 (例: "farmer-001", "farmer-002", ...)
 *
 * ■ vegetables フィールド
 *   このレシピで使う主な野菜を配列で列挙してください。
 *   マッチング時に「選択された野菜が1つ以上含まれているか」で判定します。
 *
 * ■ category フィールド
 *   'japanese' | 'western' | 'chinese' | 'simple' | 'preserved' | 'other'
 *   から選んでください。
 *
 * ■ protein フィールド（任意）
 *   省略すると「野菜のみ」扱いになります。
 *   例: '肉', '魚', '卵', '豆腐'
 *
 * ■ tags フィールド（任意）
 *   検索・フィルタリング用の自由なタグです。
 *   例: ['作り置き', '子供向け', '時短']
 * ============================================================
 */

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------

export type FarmerRecipeCategory =
  | 'japanese'   // 和風
  | 'western'    // 洋風
  | 'chinese'    // 中華風
  | 'simple'     // 素材本来の味
  | 'preserved'  // 作り置き・保存食
  | 'other';     // その他

export interface FarmerRecipe {
  /** ユニークID。"farmer-" + 連番で命名 */
  id: string;
  /** 料理名 */
  title: string;
  /** 主に使う野菜（マッチング判定に使用） */
  vegetables: string[];
  /** 追加タンパク質（省略可） */
  protein?: string;
  /** カテゴリ */
  category: FarmerRecipeCategory;
  /** 材料リスト（2人分） */
  ingredients: string[];
  /** 調理手順 */
  steps: string[];
  /** レシピの説明・農家からのひとこと */
  description: string;
  /** 自由タグ（省略可） */
  tags?: string[];
}

// -------------------------------------------------------
// 農家直伝レシピデータ
// ここにレシピを追加していってください
// -------------------------------------------------------

export const farmerRecipes: FarmerRecipe[] = [
  {
    id: 'farmer-001',
    title: '大根の葉っぱふりかけ',
    vegetables: ['大根'],
    category: 'japanese',
    ingredients: [
      '大根の葉 1本分',
      'ごま油 大さじ1',
      '醤油 大さじ1',
      'みりん 大さじ1',
      '白ごま 大さじ1',
      '鰹節 ひとつかみ',
    ],
    steps: [
      '大根の葉をよく洗い、小口切りにする。',
      'フライパンにごま油を熱し、葉を炒める。',
      '醤油・みりんを加えて水分が飛ぶまで炒める。',
      '火を止めて白ごまと鰹節を混ぜ合わせる。',
      '冷ましてから密閉容器に入れ、冷蔵で1週間保存可能。',
    ],
    description: '捨てがちな大根の葉を丸ごと使い切る農家の知恵。ご飯のお供にぴったり。',
    tags: ['作り置き', '節約', '時短'],
  },
  {
    id: 'farmer-002',
    title: 'にんじんの塩きんぴら',
    vegetables: ['にんじん'],
    category: 'japanese',
    ingredients: [
      'にんじん 2本（細切り）',
      'ごま油 大さじ1',
      '塩 小さじ1/2',
      '白ごま 適量',
      '鷹の爪 1本（お好みで）',
    ],
    steps: [
      'にんじんを細切りにする（ピーラーで薄く削ると食感が良い）。',
      'フライパンにごま油と鷹の爪を入れて熱する。',
      'にんじんを加えて中火で3〜4分炒める。',
      '塩で味を調え、白ごまを振って完成。',
    ],
    description: '醤油を使わず塩だけで仕上げるシンプルきんぴら。にんじんの甘みが際立ちます。',
    tags: ['作り置き', '素材本来の味', '時短'],
  },
  {
    id: 'farmer-003',
    title: 'トマトの塩麹漬け',
    vegetables: ['トマト', 'ミニトマト'],
    category: 'simple',
    ingredients: [
      'トマト 2個（またはミニトマト 20個）',
      '塩麹 大さじ2',
      'オリーブオイル 小さじ1',
      '青じそ 5枚（お好みで）',
    ],
    steps: [
      'トマトを食べやすい大きさに切る（ミニトマトはそのままか半割り）。',
      'ボウルに塩麹とオリーブオイルを混ぜる。',
      'トマトを加えて全体をやさしく和える。',
      '冷蔵庫で30分以上漬けて完成。食べる直前に青じそを散らす。',
    ],
    description: '農家の定番保存食。塩麹がトマトの旨みを引き出します。翌日がさらに美味しい。',
    tags: ['作り置き', '夏野菜', '発酵'],
  },
  {
    id: 'farmer-004',
    title: 'じゃがいもの味噌バター炒め',
    vegetables: ['じゃがいも'],
    category: 'japanese',
    ingredients: [
      'じゃがいも 3個（一口大に切る）',
      'バター 10g',
      '味噌 大さじ1',
      'みりん 大さじ1',
      '長ねぎ（小口切り） 適量',
    ],
    steps: [
      'じゃがいもを一口大に切り、水にさらしてアクを抜く。',
      '電子レンジ（600W）で4分加熱して火を通す。',
      'フライパンにバターを溶かし、じゃがいもを炒める。',
      '味噌とみりんを合わせたものを加えて絡める。',
      '長ねぎを散らして完成。',
    ],
    description: '畑から掘りたてのじゃがいもで作る農家の定番おかず。味噌とバターの組み合わせが絶品。',
    tags: ['ガッツリ系', '子供向け'],
  },
  {
    id: 'farmer-005',
    title: 'レタスのさっと炒め 塩昆布和え',
    vegetables: ['レタス'],
    category: 'simple',
    ingredients: [
      'レタス 1/2玉（大きめにちぎる）',
      '塩昆布 大さじ2',
      'ごま油 大さじ1',
      '白ごま 適量',
    ],
    steps: [
      'レタスを大きめにちぎる。',
      'フライパンにごま油を熱し、レタスを強火でさっと炒める（30秒程度）。',
      '火を止めて塩昆布を加え、余熱で和える。',
      '白ごまを振って完成。',
    ],
    description: '加熱しすぎないのがコツ。シャキシャキ感を残すのが農家流。',
    tags: ['時短', '素材本来の味'],
  },
];

// -------------------------------------------------------
// マッチング関数
// -------------------------------------------------------

/**
 * 選択された野菜・タンパク質・カテゴリに合う農家直伝レシピを返す。
 *
 * @param selectedVegetables - ユーザーが選択した野菜名の配列
 * @param protein            - 選択されたタンパク質（省略可）
 * @param category           - カテゴリ絞り込み（省略時は全カテゴリ）
 * @param limit              - 最大返却件数（デフォルト: 3）
 * @returns マッチしたFarmerRecipeの配列
 */
export const findMatchingFarmerRecipes = (
  selectedVegetables: string[],
  protein?: string,
  category?: FarmerRecipeCategory,
  limit = 3
): FarmerRecipe[] => {
  const normalizedVegs = selectedVegetables.map((v) => v.trim());

  return farmerRecipes
    .filter((recipe) => {
      // 野菜マッチング: レシピの野菜が1つ以上選択されていればOK
      const vegMatch = recipe.vegetables.some((v) =>
        normalizedVegs.some(
          (sv) => sv.includes(v) || v.includes(sv)
        )
      );
      if (!vegMatch) return false;

      // カテゴリ絞り込み（指定がある場合のみ）
      if (category && recipe.category !== category) return false;

      return true;
    })
    // マッチした野菜数が多い順にソート（より関連性が高いものを優先）
    .sort((a, b) => {
      const aCount = a.vegetables.filter((v) =>
        normalizedVegs.some((sv) => sv.includes(v) || v.includes(sv))
      ).length;
      const bCount = b.vegetables.filter((v) =>
        normalizedVegs.some((sv) => sv.includes(v) || v.includes(sv))
      ).length;
      return bCount - aCount;
    })
    .slice(0, limit);
};

/**
 * FarmerRecipe を既存の Recipe 型に変換する。
 * RecipeCard コンポーネントをそのまま使い回すために使用。
 */
export const farmerRecipeToRecipe = (fr: FarmerRecipe) => ({
  id: fr.id,
  title: `【農家直伝】${fr.title}`,
  ingredients: fr.ingredients,
  instructions: fr.steps,
  visualDescription: fr.description,
  reuseTip: fr.description,
  createdAt: new Date().toISOString(),
});
