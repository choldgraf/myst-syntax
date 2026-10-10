import assert from 'node:assert/strict';
import { test } from 'node:test';
import { patterns } from './codemirror.ts';

const matches = (name: keyof typeof patterns, line: string) => [...line.matchAll(patterns[name])].map((m) => m[0]);

test('patterns match MyST syntax', () => {
  assert.deepEqual(matches('role', 'See {numref}`fig-1` and {ref}`intro`.'), ['{numref}`fig-1`', '{ref}`intro`']);
  assert.deepEqual(matches('directive', '```{figure} logo.svg'), ['{figure}']);
  assert.deepEqual(matches('directive', ':::{tab-item} First'), ['{tab-item}']);
  assert.deepEqual(matches('directive', '``` {note}'), ['{note}']);
  assert.deepEqual(matches('directive', 'text {figure}'), []);
  assert.deepEqual(matches('option', ':label: fig-1'), [':label:']);
  assert.deepEqual(matches('option', '  :class: x'), [':class:']);
  assert.deepEqual(matches('option', ':::{note}'), []);
  assert.deepEqual(matches('label', '(intro)='), ['(intro)=']);
  assert.deepEqual(matches('label', '  (fig.1|a)='), ['(fig.1|a)=']);
  assert.deepEqual(matches('label', '(a b)='), []);
  assert.deepEqual(matches('math', 'a $x^2$ and $ y $, not $$z$$'), ['$x^2$', '$ y $']);
  assert.deepEqual(matches('math', 'cost $5 or $10'), ['$5 or $']);
  assert.deepEqual(matches('citation', 'As @smith2020 said; mail a@b.org'), ['@smith2020']);
});

test('role and directive names can use `.` and `+`, like mystmd', () => {
  for (const name of ['note', 'a.b', 'a+b', 'a:b', 'a-b', 'a_b']) {
    assert.deepEqual(matches('role', `{${name}}\`x\``), [`{${name}}\`x\``]);
    assert.deepEqual(matches('directive', `\`\`\`{${name}}`), [`{${name}}`]);
    assert.deepEqual(matches('directive', `:::{${name}}`), [`{${name}}`]);
  }
});
