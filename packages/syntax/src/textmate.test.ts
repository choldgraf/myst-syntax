import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cases } from './cases.ts';
import { scoped, scopes } from './tokenize.ts';

test('the grammar scopes MyST syntax', () => {
  for (const [kind, list] of Object.entries(cases)) {
    for (const [doc, expected] of list) assert.deepEqual(scoped(doc, scopes[kind as keyof typeof cases]), expected);
  }
});

test('display math is highlighted', () => {
  assert.deepEqual(scoped('$$\nx^2\n$$ (eq1)\n\n$$y$$\n\nText', 'string.other.math.block.myst'), ['x^2', 'y']);
  assert.deepEqual(scoped('$$\nx\n\nText', 'string.other.math.block.myst'), ['x']);
});

test('code directives are highlighted in their language', () => {
  const cell = '```{code-cell} ipython3\n:tags: [hide-input]\ndef f(): pass\n```';
  assert.deepEqual(scoped(cell, 'entity.name.function.directive.myst'), ['code-cell']);
  assert.deepEqual(scoped(cell, 'entity.other.attribute-name.myst'), ['tags']);
  assert.deepEqual(scoped(cell, 'storage.type.function.python'), ['def']);
  assert.deepEqual(scoped(cell + '\n{ref}`x`', 'entity.name.function.role.myst'), ['ref']);
  assert.deepEqual(scoped(':::{code-cell} python\ndef f(): pass\n:::\n{ref}`x`', 'storage.type.function.python'), ['def']);
  assert.deepEqual(scoped('~~~{code} python\ndef f(): pass\n~~~\n{ref}`x`', 'storage.type.function.python'), ['def']);
});

test('code in other languages stays plain', () => {
  const block = '```{code} fortran\n{ref}`x`\n```';
  assert.deepEqual(scoped(block, 'entity.name.function.directive.myst'), ['code']);
  assert.deepEqual(scoped(block, 'entity.name.function.role.myst'), []);
});

test('a longer fence closes a directive', () => {
  assert.deepEqual(scoped('````{note}\n`````\n% a comment', 'meta.directive.myst'), ['````', '{', 'note', '}', '`````']);
  assert.deepEqual(scoped('````{code-cell} python\ndef f(): pass\n```\ndef g(): pass\n````', 'storage.type.function.python'), ['def', 'def']);
});

test('an indented fence closes a directive in a list item', () => {
  const item = '- ```{code-cell} python\n  def f(): pass\n  ```\n  def g(): pass';
  assert.deepEqual(scoped(item, 'storage.type.function.python'), ['def']);
});
