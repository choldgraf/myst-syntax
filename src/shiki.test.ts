import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import markdown from '@shikijs/langs/markdown';
import { createHighlighter } from 'shiki';

const myst = JSON.parse(readFileSync(new URL('../myst.tmLanguage.json', import.meta.url), 'utf8'));

// The README's two Shiki recipes. Shiki rebuilds markdown without its injections when it loads a second lazily embedded language,
// so either load yaml before markdown, or empty markdown's lazy list and then the order doesn't matter.
const recipes = {
  'yaml before markdown': ['yaml', 'markdown', myst],
  'markdown with no lazy languages': [{ ...markdown[0], embeddedLangsLazy: [] }, 'yaml', myst],
};

for (const [name, langs] of Object.entries(recipes)) {
  test(`Shiki highlights MyST: ${name}`, async () => {
    const highlighter = await createHighlighter({ themes: ['github-light'], langs });
    const src = '{ref}`x`\n\n```{note}\n---\nclass: tip\n---\nHi\n```';
    const lines = highlighter.codeToTokensBase(src, { lang: 'markdown', theme: 'github-light', includeExplanation: 'scopeName' });
    // Every scope name in the document.
    const scopes = new Set(lines.flat().flatMap((t) => t.explanation ?? []).flatMap((e) => e.scopes.map((s) => s.scopeName)));
    highlighter.dispose();
    assert.ok(scopes.has('entity.name.function.role.myst'));
    assert.ok(scopes.has('entity.name.function.directive.myst'));
    assert.ok(scopes.has('entity.name.tag.yaml'));
  });
}
