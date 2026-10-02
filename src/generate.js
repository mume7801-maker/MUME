const themes = {
  budget: ['予算・住宅ローン', '本体価格と総予算を分けて整理する', '諸費用・外構・家具まで見積もりに含まれるか確認する', '月々の返済と暮らしに必要な支出を一緒に考える'],
  land: ['土地選び', '家族が大切にしたい生活条件を整理する', 'ハザード情報や周辺環境を公的情報と現地で確認する', '建築条件や追加工事の可能性を住宅会社に確認する'],
  layout: ['間取り', '朝から夜までの家族の動きを書き出す', '家事動線と収納の位置を図面で確認する', '家具の寸法を置いて通路と使い勝手を確認する'],
  builder: ['住宅会社選び', '予算・性能・デザインの優先順位を決める', '同じ条件で見積もりの範囲を比較する', '保証やアフターサービスの内容を書面で確認する'],
  regrets: ['後悔を減らす家づくり', '今の住まいで困っていることを書き出す', '新しい家でどう解決するか図面と仕様で確認する', '迷っている点を契約前に質問して記録する']
};

export function generate(input) {
  if (!input || typeof input !== 'object') throw new Error('入力内容を確認してください。');
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (text.length < 20) throw new Error('参考投稿の文章・文字起こしを20文字以上入力してください。URLのみでは分析できません。');
  if (text.length > 12000) throw new Error('参考文章は12,000文字以内にしてください。');
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  if (url) {
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error('参考URLを確認してください。'); }
    if (parsed.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(parsed.hostname)) throw new Error('InstagramのHTTPS URLを入力してください。');
  }
  const theme = themes[input.theme];
  if (!theme) throw new Error('テーマを選択してください。');
  const duration = Number(input.duration);
  if (![30, 60].includes(duration)) throw new Error('動画の長さを選択してください。');
  const sentences = text.split(/[。！？!?\n]+/).map(s => s.trim()).filter(Boolean);
  const observations = [];
  if (/[？?]/.test(text)) observations.push('疑問形があります。視聴者への問いかけに使える表現です。');
  if (/[0-9０-９]/.test(text)) observations.push('数字があります。費用・件数・期間など、何を表すか確認してください。');
  if (/保存|コメント|フォロー|相談|プロフィール/.test(text)) observations.push('保存・コメント・相談などを促す表現があります。');
  if (/後悔|失敗|不安|悩|注意/.test(text)) observations.push('不安や注意点に触れる語句があります。煽りすぎない表現に整えましょう。');
  if (!observations.length) observations.push('定型の語句では特徴を判定できませんでした。参考文章を読んで補足してください。');
  const title = `${theme[0]}で迷ったら、確認したい3つのこと`;
  const intro = `家づくりで${theme[0]}に迷っていませんか？ 決める前に、この3つを確認してみてください。`;
  const points = theme.slice(1).map((point, i) => `${i + 1}つ目。${point}。`);
  const outro = 'ご家族に合う答えはそれぞれ違います。打ち合わせ前に見返せるよう、保存しておきましょう。';
  const script = [{ label: duration === 30 ? '0〜5秒｜冒頭' : '0〜8秒｜冒頭', text: intro },
    { label: duration === 30 ? '5〜24秒｜本文' : '8〜48秒｜本文', text: points.join('\n') + (duration === 60 ? '\n今の住まいで困っていることと照らし合わせて、気になる点をメモして担当者に聞いてみましょう。' : '') },
    { label: duration === 30 ? '24〜30秒｜締め' : '48〜60秒｜締め', text: outro }];
  return { mode: 'rules', title, analysis: { first: sentences[0]?.slice(0, 240), last: sentences.at(-1)?.slice(0, 240), observations }, script,
    caption: `${title}\n\n${theme.slice(1).map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${outro}\n\n#家づくり #注文住宅 #マイホーム`,
    checks: ['数字・制度・費用・性能に関する主張は、最新の一次情報や担当者に確認してください。', '入力文の冒頭と末尾を抜粋しています。観察は語句の検出によるもので、伸びた理由を示すものではありません。', '台本は選択テーマの定型下書きです。参考投稿の意味をAIで分析・反映する機能は未接続です。', '尺は目安です。声に出して読み、動画の長さに合わせて調整してください。'], reference: url };
}
