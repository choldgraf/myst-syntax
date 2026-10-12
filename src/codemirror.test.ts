import assert from 'node:assert/strict';
import { test } from 'node:test';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { LanguageDescription, syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { cases } from './cases.ts';
import { inCode, mystCode, patterns } from './codemirror.ts';

const matches = (name: keyof typeof patterns, line: string) => [...line.matchAll(patterns[name])].map((m) => m[0]);

// Line by line, as MatchDecorator does.
const names = (name: keyof typeof patterns, doc: string) => doc.split('\n').flatMap((l) => [...l.matchAll(patterns[name])].map((m) => m[1]));

test('patterns match the shared cases', () => {
  for (const [kind, list] of Object.entries(cases)) {
    for (const [doc, expected] of list) assert.deepEqual(names(kind as keyof typeof cases, doc), expected);
  }
});

test('patterns match math and citations', () => {
  assert.deepEqual(matches('math', 'a $x^2$ and $ y $, not $$z$$'), ['$x^2$', '$ y $']);
  assert.deepEqual(matches('math', 'cost $5 or $10'), ['$5 or $']);
  assert.deepEqual(matches('citation', 'As @smith2020 said; mail a@b.org'), ['@smith2020']);
  assert.deepEqual(matches('citation', 'See @doi:10.1/x.'), ['@doi:10.1/x']);
});

test('code is skipped, but directive bodies are not', () => {
  const doc = '```python\n@property\n```\n\n```{note}\n@smith\n```\n\n```{code-cell}\n@cell\n```\n\nSee `@x` and @y.';
  const state = EditorState.create({ doc, extensions: [markdown()] });
  const at = (text: string) => inCode(state, doc.indexOf(text));
  assert.deepEqual([at('@property'), at('@smith'), at('@cell'), at('@x'), at('@y')], [true, false, true, true, false]);
});

test('mystCode parses code directives in their language', () => {
  const languages = [LanguageDescription.of({ name: 'Python', support: python() })];
  const doc = '```{code-cell} ipython3\ndef f(): pass\n```\n\n```{note}\ndef\n```\n\n```python\nclass\n```';
  const tree = syntaxTree(EditorState.create({ doc, extensions: [markdown({ codeLanguages: languages, extensions: [mystCode(languages)] })] }));
  const at = (i: number) => tree.resolveInner(i, 1).name;
  assert.equal(at(doc.indexOf('def')), 'def');
  assert.notEqual(at(doc.lastIndexOf('def')), 'def');
  assert.equal(at(doc.indexOf('class')), 'class');
});
