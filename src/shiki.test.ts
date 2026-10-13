import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createHighlighter } from 'shiki';

// The README's Shiki recipe. Keep this order: loading yaml after markdown makes Shiki rebuild markdown without its injections.
test('Shiki highlights MyST when yaml is loaded before markdown', async () => {
  const myst = JSON.parse(readFileSync(new URL('../myst.tmLanguage.json', import.meta.url), 'utf8'));
  const highlighter = await createHighlighter({ themes: ['github-light'], langs: ['yaml', 'markdown', myst] });
  const src = '{ref}`x`\n\n```{note}\n---\nclass: tip\n---\nHi\n```';
  const lines = highlighter.codeToTokensBase(src, { lang: 'markdown', theme: 'github-light', includeExplanation: 'scopeName' });
  // Every scope name in the document.
  const scopes = new Set(lines.flat().flatMap((t) => t.explanation ?? []).flatMap((e) => e.scopes.map((s) => s.scopeName)));
  highlighter.dispose();
  assert.ok(scopes.has('entity.name.function.role.myst'));
  assert.ok(scopes.has('entity.name.function.directive.myst'));
  assert.ok(scopes.has('entity.name.tag.yaml'));
});
