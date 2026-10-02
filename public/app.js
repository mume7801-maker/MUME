const $ = id => document.getElementById(id);
let current = null;
const key = 'mume-drafts-v1';
function readDrafts() { try { const data = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }
function show(data) {
  current = data;
  $('empty').hidden = true; $('result').hidden = false;
  $('title').textContent = data.title;
  $('analysis').replaceChildren();
  for (const [label, text] of [['冒頭の抜粋', data.analysis.first], ['末尾の抜粋', data.analysis.last]]) {
    const p = document.createElement('p'); p.textContent = label; const quote = document.createElement('blockquote'); quote.textContent = text; $('analysis').append(p, quote);
  }
  const list = document.createElement('ul');
  for (const observation of data.analysis.observations) { const li = document.createElement('li'); li.textContent = observation; list.append(li); }
  $('analysis').append(list);
  $('script').value = data.editedScript ?? data.script.map(part => `${part.label}\n${part.text}`).join('\n\n');
  $('caption').value = data.editedCaption ?? data.caption;
  $('checks').replaceChildren();
  for (const check of data.checks) { const li = document.createElement('li'); li.textContent = check; $('checks').append(li); }
}
$('form').addEventListener('submit', async event => {
  event.preventDefault(); $('generate').disabled = true; $('status').textContent = '下書きを作成しています…';
  try {
    const input = { url: $('url').value, text: $('text').value, theme: $('theme').value, duration: $('duration').value };
    const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    show({ ...data, input }); $('status').textContent = '下書きを作成しました。内容を確認し、編集してください。';
  } catch (error) { $('status').textContent = `作成できませんでした：${error.message}`; }
  finally { $('generate').disabled = false; }
});
function history() {
  const container = $('history'); container.replaceChildren(); const drafts = readDrafts();
  if (!drafts.length) { const p = document.createElement('p'); p.textContent = '保存した下書きはまだありません。'; container.append(p); }
  drafts.forEach((draft, i) => {
    const row = document.createElement('div'); row.className = 'history-item'; const label = document.createElement('span'); label.textContent = draft.title;
    const open = document.createElement('button'); open.textContent = '開く'; open.addEventListener('click', () => { show(draft); if (draft.input) { for (const field of ['url', 'text', 'theme', 'duration']) $(field).value = draft.input[field]; } $('result').scrollIntoView({ behavior: 'smooth' }); });
    const remove = document.createElement('button'); remove.className = 'secondary'; remove.textContent = '削除'; remove.addEventListener('click', () => { if (!confirm('この下書きを削除しますか？')) return; try { const updated = readDrafts(); updated.splice(i, 1); localStorage.setItem(key, JSON.stringify(updated)); history(); } catch { $('status').textContent = '削除できませんでした。ブラウザーの保存設定を確認してください。'; } });
    row.append(label, open, remove); container.append(row);
  });
}
$('save').addEventListener('click', () => {
  if (!current) return;
  try { const drafts = readDrafts(); drafts.unshift({ ...current, editedScript: $('script').value, editedCaption: $('caption').value }); localStorage.setItem(key, JSON.stringify(drafts.slice(0, 30))); history(); $('status').textContent = 'このブラウザーに保存しました（最新30件まで）。'; }
  catch { $('status').textContent = '保存できませんでした。テキストの書き出しをご利用ください。'; }
});
$('download').addEventListener('click', () => {
  if (!current) return;
  const text = `${current.title}\n\n参考URL：${current.reference || 'なし'}\n\n${$('script').value}\n\n投稿文\n${$('caption').value}\n\n確認事項\n${current.checks.join('\n')}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'mume-script.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
history();
