import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import markdown from '@shikijs/langs/markdown';
import python from '@shikijs/langs/python';
import textmate from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

// Load the grammar the way VS Code does: injected into the Markdown grammar.
const require = createRequire(import.meta.url);
const { INITIAL, Registry } = textmate;
const { loadWASM, OnigScanner, OnigString } = oniguruma;
await loadWASM(readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')).buffer);
const myst = JSON.parse(readFileSync(new URL('../myst.tmLanguage.json', import.meta.url), 'utf8'));
const grammars: Record<string, any> = { 'text.html.markdown': markdown[0], 'source.python': python[0], [myst.scopeName]: myst };
const registry = new Registry({
  onigLib: Promise.resolve({ createOnigScanner: (p) => new OnigScanner(p), createOnigString: (s) => new OnigString(s) }),
  loadGrammar: async (scope) => grammars[scope] ?? null,
  getInjections: (scope) => (scope === 'text.html.markdown' ? [myst.scopeName] : undefined),
});
const grammar = (await registry.loadGrammar('text.html.markdown'))!;

/** The text of each token in `src` whose scopes include `scope`. */
function scoped(src: string, scope: string) {
  let stack = INITIAL;
  return src.split('\n').flatMap((line) => {
    const { tokens, ruleStack } = grammar.tokenizeLine(line, stack);
    stack = ruleStack;
    return tokens.filter((t) => t.scopes.includes(scope)).map((t) => line.slice(t.startIndex, t.endIndex));
  });
}

test('the grammar scopes MyST syntax', () => {
  assert.deepEqual(scoped('See {numref}`fig-1`.', 'entity.name.function.role.myst'), ['numref']);
  assert.deepEqual(scoped('```{figure} logo.svg\n:width: 50%\n```', 'entity.name.function.directive.myst'), ['figure']);
  assert.deepEqual(scoped('```{figure} logo.svg\n:width: 50%\n```', 'entity.other.attribute-name.myst'), ['width']);
  assert.deepEqual(scoped(':::{note}\n:::', 'entity.name.function.directive.myst'), ['note']);
  assert.deepEqual(scoped('(intro)=', 'entity.name.label.myst'), ['intro']);
  assert.deepEqual(scoped('(fig.1|a)=', 'entity.name.label.myst'), ['fig.1|a']);
  assert.deepEqual(scoped('(café)=', 'entity.name.label.myst'), []);
  assert.deepEqual(scoped('% a comment', 'comment.line.percentage.myst'), ['% a comment']);
  assert.deepEqual(scoped('  +++ {"a": 1}', 'meta.separator.myst'), ['  +++ {"a": 1}']);
  assert.deepEqual(scoped('Hi {{ name }}', 'variable.other.substitution.myst'), [' name ']);
});

test('code directives are highlighted in their language', () => {
  const cell = '```{code-cell} ipython3\n:tags: [hide-input]\ndef f(): pass\n```';
  assert.deepEqual(scoped(cell, 'entity.name.function.directive.myst'), ['code-cell']);
  assert.deepEqual(scoped(cell, 'entity.other.attribute-name.myst'), ['tags']);
  assert.deepEqual(scoped(cell, 'storage.type.function.python'), ['def']);
  assert.deepEqual(scoped(cell + '\n{ref}`x`', 'entity.name.function.role.myst'), ['ref']);
});

test('code in other languages stays plain', () => {
  const block = '```{code} fortran\n{ref}`x`\n```';
  assert.deepEqual(scoped(block, 'entity.name.function.directive.myst'), ['code']);
  assert.deepEqual(scoped(block, 'entity.name.function.role.myst'), []);
  assert.deepEqual(scoped('```text\n% not a comment\n```', 'comment.line.percentage.myst'), []);
});

test('a longer fence closes a directive', () => {
  assert.deepEqual(scoped('````{note}\n`````\n% a comment', 'meta.directive.myst'), ['````', '{', 'note', '}', '`````']);
});

test('indented code is left to Markdown', () => {
  assert.deepEqual(scoped('Text.\n\n    % not a comment\n    +++', 'comment.line.percentage.myst'), []);
});
