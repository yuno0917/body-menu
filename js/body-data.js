/* ボディメイク メニューメーカー: 設定値（データのみ。ここを書き換えるとメニューが変わる） */
(function (root) {
  'use strict';
  const Body = root.Body = root.Body || {};

  Body.DATA = {
    muscleOrder: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hams', 'glutes', 'calves', 'abs'],

    muscles: {
      chest:     { name: '胸' },
      back:      { name: '背中' },
      shoulders: { name: '肩' },
      biceps:    { name: '腕の前（力こぶ）' },
      triceps:   { name: '腕の裏（二の腕）' },
      quads:     { name: '太ももの前' },
      hams:      { name: '太ももの裏' },
      glutes:    { name: 'お尻' },
      calves:    { name: 'ふくらはぎ' },
      abs:       { name: 'お腹' }
    },

    // 1週間に各部位へ直接行うセット数の目安（全体をバランスよく鍛える場合）。
    targets: {
      beginner:     { chest: 9,  back: 10, shoulders: 8,  biceps: 6, triceps: 6, quads: 9,  hams: 6, glutes: 6, calves: 6, abs: 4 },
      intermediate: { chest: 13, back: 14, shoulders: 12, biceps: 9, triceps: 9, quads: 12, hams: 9, glutes: 9, calves: 8, abs: 6 }
    },

    // 重点部位: 重点はセット数を増やし、それ以外は少し減らす（最低 focusMin セット）。
    focusGroups: {
      balance: [],
      upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      lower: ['quads', 'hams', 'glutes', 'calves']
    },
    focusUp: 1.35,
    focusDown: 0.8,
    focusMin: 4,

    // 1種目あたりのセット数の範囲と、1回のトレーニングの合計セット数の上限。
    slotMin: 2,
    slotMax: { beginner: 4, intermediate: 5 },
    sessionMax: { beginner: 20, intermediate: 22 },
    // 重点部位の種目がある日は、上限をこの分だけ上げる。
    focusSessionBonus: { beginner: 3, intermediate: 4 },
    // 量を増やす週の1回の上限は、基本の上限のこの倍率まで。
    weekCapFactor: 1.1,

    // 時間の目安（分）: 1セットあたり（休憩込み）と、ウォームアップ。
    minutesPerSet: { main: 3, iso: 2 },
    warmupMinutes: 8,

    rest: { main: '2〜3分', iso: '1〜2分' },

    // 8週間の波。vol はセット数の倍率、rirMain / rirIso は「あと何回できる余力を残すか」。
    weeks: [
      { vol: 0.75, rirMain: 3, rirIso: 3, note: '慣らしの週です。種目の動きと、ちょうどよい重さを探すことを優先します。' },
      { vol: 1.0,  rirMain: 2, rirIso: 2, note: '基本の量に増やします。先週の記録を見て、重さを決めましょう。' },
      { vol: 1.0,  rirMain: 2, rirIso: 1, note: '腕や肩などの単関節の種目は、限界の少し手前まで行います。' },
      { vol: 1.15, rirMain: 1, rirIso: 1, note: '前半でいちばんきつい週です。フォームが崩れたらそのセットは終わりにします。' },
      { vol: 0.5,  rirMain: 4, rirIso: 4, deload: true, note: '軽め週です。セット数を半分にして疲れを抜きます。重さは先週と同じか少し軽くします。' },
      { vol: 1.0,  rirMain: 2, rirIso: 2, note: '後半のスタートです。前半より少し重い重さで始められるはずです。' },
      { vol: 1.15, rirMain: 1, rirIso: 1, note: '量を増やします。睡眠と食事をしっかりとりましょう。' },
      { vol: 1.25, rirMain: 1, rirIso: 0, note: 'プログラムでいちばんきつい週です。単関節の種目は、最後のセットだけ限界まで行って構いません。' }
    ],

    // 環境ごとの種目の並び。テンプレートの番号はこの並びの位置を指す。
    lists: {
      gym: {
        chest:     ['bench_press', 'incline_db_press', 'cable_fly'],
        back:      ['lat_pulldown', 'cable_row', 'one_arm_row'],
        shoulders: ['lateral_raise', 'face_pull', 'db_shoulder_press'],
        biceps:    ['incline_curl', 'cable_curl'],
        triceps:   ['cable_overhead_ext', 'pushdown'],
        quads:     ['squat', 'leg_press', 'leg_extension'],
        hams:      ['rdl', 'seated_leg_curl'],
        glutes:    ['hip_thrust', 'bulgarian'],
        calves:    ['calf_raise'],
        abs:       ['cable_crunch', 'hanging_leg_raise']
      },
      home: {
        chest:     ['db_bench_press', 'incline_db_press', 'db_fly'],
        back:      ['one_arm_row', 'incline_db_row', 'db_pullover'],
        shoulders: ['lateral_raise', 'rear_raise', 'db_shoulder_press'],
        biceps:    ['incline_curl', 'hammer_curl'],
        triceps:   ['db_overhead_ext', 'lying_db_ext'],
        quads:     ['goblet_squat', 'bulgarian'],
        hams:      ['db_rdl', 'single_leg_rdl'],
        glutes:    ['db_hip_thrust', 'bulgarian'],
        calves:    ['db_calf_raise'],
        abs:       ['crunch', 'lying_leg_raise']
      }
    },

    // 種目の説明。type: main は複数の関節を使う種目、iso は1つの関節を使う種目。
    // long: 筋肉が伸びた位置で負荷がかかりやすい種目。
    exercises: {
      bench_press:        { name: 'バーベルベンチプレス',           type: 'main', reps: '6〜10',  cue: '肩甲骨を寄せて下げ、みぞおちの少し上にバーを下ろします。' },
      db_bench_press:     { name: 'ダンベルベンチプレス',           type: 'main', reps: '8〜12',  cue: '胸がしっかり伸びるところまで、ダンベルを深く下ろします。' },
      incline_db_press:   { name: 'インクラインダンベルプレス',     type: 'main', reps: '8〜12',  cue: 'ベンチの角度は30度前後にして、胸の上のほうを狙います。' },
      cable_fly:          { name: 'ケーブルフライ',                 type: 'iso',  reps: '10〜15', cue: '肘を軽く曲げたまま、胸を大きく開いてから閉じます。', long: true },
      db_fly:             { name: 'ダンベルフライ',                 type: 'iso',  reps: '10〜15', cue: '胸が伸びるところまで腕を開きます。肩が痛む手前で止めてください。', long: true },
      lat_pulldown:       { name: 'ラットプルダウン',               type: 'main', reps: '8〜12',  cue: '胸を張って、肘を下に引きます。上では腕をしっかり伸ばします。' },
      cable_row:          { name: 'シーテッドケーブルロウ',         type: 'main', reps: '8〜12',  cue: '上体を大きく揺らさず、肘を後ろに引きます。' },
      one_arm_row:        { name: 'ワンハンドダンベルロウ',         type: 'main', reps: '8〜12',  cue: 'ベンチに片手をつき、肘を腰のほうに向かって引きます。' },
      incline_db_row:     { name: 'インクラインダンベルロウ',       type: 'main', reps: '8〜12',  cue: '角度をつけたベンチにうつ伏せになり、両手のダンベルを引きます。' },
      db_pullover:        { name: 'ダンベルプルオーバー',           type: 'iso',  reps: '10〜15', cue: '肘を軽く曲げたまま、頭の後ろにダンベルを下ろします。', long: true },
      lateral_raise:      { name: 'サイドレイズ',                   type: 'iso',  reps: '12〜20', cue: '肩をすくめず、肘から横に上げます。反動は使いません。' },
      face_pull:          { name: 'フェイスプル',                   type: 'iso',  reps: '12〜20', cue: 'ロープを顔に向かって引き、肩の後ろを使います。' },
      rear_raise:         { name: 'リアレイズ',                     type: 'iso',  reps: '12〜20', cue: '上体を前に倒し、腕を横に広げます。肩の後ろを使います。' },
      db_shoulder_press:  { name: 'ダンベルショルダープレス',       type: 'main', reps: '8〜12',  cue: '背もたれに背中をつけて座り、頭の上に押し上げます。' },
      incline_curl:       { name: 'インクラインダンベルカール',     type: 'iso',  reps: '10〜15', cue: 'ベンチを後ろに倒し、腕を後ろに垂らした位置から曲げます。', long: true },
      cable_curl:         { name: 'ケーブルカール',                 type: 'iso',  reps: '10〜15', cue: '肘の位置を動かさず、上げきったところで一瞬止めます。' },
      hammer_curl:        { name: 'ハンマーカール',                 type: 'iso',  reps: '10〜15', cue: '手のひらを向かい合わせたまま、肘を曲げます。' },
      cable_overhead_ext: { name: 'ケーブル オーバーヘッドエクステンション', type: 'iso', reps: '10〜15', cue: '頭の上で肘を曲げ伸ばしします。二の腕の裏が伸びるのを感じてください。', long: true },
      pushdown:           { name: 'プッシュダウン',                 type: 'iso',  reps: '10〜15', cue: '肘を体の横に固定して、下まで押し切ります。' },
      db_overhead_ext:    { name: 'ダンベル オーバーヘッドエクステンション', type: 'iso', reps: '10〜15', cue: '両手で1つのダンベルを持ち、頭の後ろに下ろします。', long: true },
      lying_db_ext:       { name: 'ライイング ダンベルエクステンション', type: 'iso', reps: '10〜15', cue: 'ベンチにあお向けになり、肘を固定したまま曲げ伸ばしします。' },
      squat:              { name: 'バーベルスクワット',             type: 'main', reps: '6〜10',  cue: '太ももが床と平行になるくらいまで、深くしゃがみます。' },
      leg_press:          { name: 'レッグプレス',                   type: 'main', reps: '10〜15', cue: 'お尻が浮かない範囲で、膝を胸に近づけるように深く下ろします。' },
      leg_extension:      { name: 'レッグエクステンション',         type: 'iso',  reps: '12〜15', cue: '上げきったところで一瞬止め、ゆっくり下ろします。' },
      goblet_squat:       { name: 'ゴブレットスクワット',           type: 'main', reps: '10〜15', cue: 'ダンベルを胸の前で持ち、深くしゃがみます。' },
      bulgarian:          { name: 'ブルガリアンスクワット',         type: 'main', reps: '8〜12（片脚ずつ）', cue: '後ろの足をベンチに乗せ、前の脚で深くしゃがみます。' },
      rdl:                { name: 'ルーマニアンデッドリフト',       type: 'main', reps: '8〜12',  cue: '膝を軽く曲げたまま、お尻を後ろに引いてバーを下ろします。', long: true },
      db_rdl:             { name: 'ダンベル ルーマニアンデッドリフト', type: 'main', reps: '10〜15', cue: '膝を軽く曲げたまま、お尻を後ろに引いてダンベルを下ろします。', long: true },
      seated_leg_curl:    { name: 'シーテッドレッグカール',         type: 'iso',  reps: '10〜15', cue: '座った姿勢で行うと、太ももの裏が伸びた状態で鍛えられます。', long: true },
      single_leg_rdl:     { name: 'シングルレッグ ルーマニアンデッドリフト', type: 'main', reps: '10〜12（片脚ずつ）', cue: '片脚で立ち、上体を倒しながら反対の脚を後ろに伸ばします。', long: true },
      hip_thrust:         { name: 'バーベルヒップスラスト',         type: 'main', reps: '8〜12',  cue: '肩をベンチに乗せ、お尻を押し上げます。上で一瞬止めます。' },
      db_hip_thrust:      { name: 'ダンベルヒップスラスト',         type: 'main', reps: '10〜15', cue: '肩をベンチに乗せ、腰の上にダンベルを置いてお尻を押し上げます。' },
      calf_raise:         { name: 'カーフレイズ',                   type: 'iso',  reps: '10〜15', cue: 'かかとを深く下ろし、ふくらはぎが伸びた位置から上げます。', long: true },
      db_calf_raise:      { name: 'ダンベルカーフレイズ',           type: 'iso',  reps: '12〜20', cue: '段差につま先を乗せ、かかとを深く下ろしてから上げます。', long: true },
      cable_crunch:       { name: 'ケーブルクランチ',               type: 'iso',  reps: '10〜15', cue: 'ロープを頭の横で持ち、背中を丸めてお腹を縮めます。' },
      hanging_leg_raise:  { name: 'ハンギングレッグレイズ',         type: 'iso',  reps: '10〜15', cue: '鉄棒にぶら下がり、骨盤を丸めるように脚を上げます。' },
      crunch:             { name: 'クランチ',                       type: 'iso',  reps: '12〜20', cue: '腰を床につけたまま、おへそをのぞき込むように背中を丸めます。' },
      lying_leg_raise:    { name: 'ライイングレッグレイズ',         type: 'iso',  reps: '12〜20', cue: 'あお向けで脚を上げ下げします。腰が反らないように注意します。' }
    },

    // 週の回数ごとの組み方。[部位, 種目の番号]。
    // extra は重点部位を選んだときだけ追加する種目。
    templates: {
      2: [
        { title: '全身A', slots: [['quads', 0], ['chest', 0], ['back', 0], ['hams', 0], ['shoulders', 0], ['triceps', 0], ['abs', 0]],
          extra: { upper: [['chest', 2], ['shoulders', 2]], lower: [['glutes', 1], ['hams', 1]] } },
        { title: '全身B', slots: [['glutes', 0], ['back', 1], ['chest', 1], ['quads', 1], ['shoulders', 1], ['biceps', 0], ['calves', 0]],
          extra: { upper: [['back', 2], ['triceps', 1]], lower: [['quads', 2], ['hams', 1]] } }
      ],
      3: [
        { title: '全身A', slots: [['quads', 0], ['hams', 1], ['chest', 0], ['back', 0], ['shoulders', 0], ['triceps', 0], ['abs', 0]],
          extra: { upper: [['chest', 2]], lower: [['glutes', 0]] } },
        { title: '全身B', slots: [['hams', 0], ['glutes', 1], ['chest', 1], ['back', 1], ['shoulders', 1], ['biceps', 0], ['calves', 0]],
          extra: { upper: [['back', 2]], lower: [['quads', 2]] } },
        { title: '全身C', slots: [['glutes', 0], ['quads', 1], ['chest', 2], ['back', 2], ['shoulders', 0], ['triceps', 1], ['biceps', 1]],
          extra: { upper: [['shoulders', 1]], lower: [['hams', 1]] } }
      ],
      4: [
        { title: '上半身A', slots: [['chest', 0], ['back', 0], ['shoulders', 2], ['shoulders', 0], ['triceps', 0], ['biceps', 0]],
          extra: { upper: [['chest', 2], ['back', 1]] } },
        { title: '下半身A', slots: [['quads', 0], ['hams', 0], ['glutes', 1], ['calves', 0], ['abs', 0]],
          extra: { lower: [['glutes', 0], ['quads', 2]] } },
        { title: '上半身B', slots: [['back', 1], ['chest', 1], ['back', 2], ['shoulders', 1], ['biceps', 1], ['triceps', 1]],
          extra: { upper: [['shoulders', 0], ['chest', 0]] } },
        { title: '下半身B', slots: [['glutes', 0], ['quads', 1], ['hams', 1], ['calves', 0], ['abs', 1]],
          extra: { lower: [['hams', 0]] } }
      ],
      5: [
        { title: '上半身', slots: [['chest', 0], ['back', 0], ['shoulders', 0], ['triceps', 0], ['biceps', 0]],
          extra: { upper: [['shoulders', 1]] } },
        { title: '下半身', slots: [['quads', 0], ['hams', 0], ['glutes', 0], ['calves', 0], ['abs', 0]],
          extra: { lower: [['quads', 2]] } },
        { title: '押す日', slots: [['chest', 1], ['shoulders', 2], ['chest', 2], ['shoulders', 0], ['triceps', 1]],
          extra: { upper: [['triceps', 0]] } },
        { title: '引く日', slots: [['back', 1], ['back', 2], ['shoulders', 1], ['biceps', 1], ['abs', 1]],
          extra: { upper: [['biceps', 0]] } },
        { title: '脚の日', slots: [['glutes', 1], ['quads', 1], ['hams', 1], ['calves', 0]],
          extra: { lower: [['glutes', 0]] } }
      ]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
