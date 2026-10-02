import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/generate.js';
const input = { text: '家づくりの予算で後悔していませんか？見積もりは3つの項目を確認しましょう。あとで保存してください。', theme: 'budget', duration: 30 };
test('observations come from reference text and draft matches housing theme', () => {
  const result = generate(input);
  assert.equal(result.mode, 'rules'); assert.match(result.analysis.first, /予算/);
  assert.equal(result.analysis.observations.length, 4);
  assert.match(result.script[1].text, /諸費用/); assert.equal(result.script.length, 3);
});
test('all five themes support both requested durations', () => {
  for (const theme of ['budget', 'land', 'layout', 'builder', 'regrets']) for (const duration of [30, 60]) {
    const result = generate({ ...input, theme, duration }); assert.match(result.script[2].label, new RegExp(`${duration}秒`)); assert.ok(result.caption.includes('#家づくり'));
  }
});
test('reject URL-only input and non-Instagram URL', () => {
  assert.throws(() => generate({ ...input, text: '', url: 'https://www.instagram.com/reel/example' }), /20文字/);
  assert.throws(() => generate({ ...input, url: 'https://example.com' }), /Instagram/);
  assert.equal(generate({ ...input, url: 'https://www.instagram.com/reel/example' }).reference, 'https://www.instagram.com/reel/example');
});
test('reject malformed fields and oversized text', () => {
  assert.throws(() => generate(null), /入力/); assert.throws(() => generate({ ...input, theme: 'unknown' }), /テーマ/);
  assert.throws(() => generate({ ...input, duration: 90 }), /長さ/); assert.throws(() => generate({ ...input, text: 'あ'.repeat(12001) }), /12,000/);
});
