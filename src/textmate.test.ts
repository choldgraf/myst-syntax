import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cases } from './cases.ts';
import { scoped, scopes } from './tokenize.ts';

test('the grammar scopes MyST syntax', () => {
  for (const [kind, list] of Object.entries(cases)) {
    for (const [doc, expected] of list) assert.deepEqual(scoped(doc, scopes[kind as keyof typeof cases]), expected);
  }
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
  assert.deepEqual(scoped('````{code-cell} python\ndef f(): pass\n```\ndef g(): pass\n````', 'storage.type.function.python'), ['def', 'def']);
});

test('indented code is left to Markdown', () => {
  assert.deepEqual(scoped('Text.\n\n    % not a comment\n    +++', 'comment.line.percentage.myst'), []);
});
