/** MyST examples both parts are checked against: each is a document and the names in it, in order. */
const names = ['note', 'a.b', 'a+b', 'a:b', 'a-b', 'a_b'];

export const cases = {
  role: [['See {numref}`fig-1` and {ref}`intro`.', ['numref', 'ref']], ...names.map((n) => [`{${n}}\`x\``, [n]]), [':::{code-block} python\n{ref}`x`\n:::', []], ['~~~{note}\n{ref}`x`\n~~~', ['ref']], ['~~~{code} python\n{ref}`x`\n~~~', []]],
  directive: [
    ['```{figure} logo.svg\n```', ['figure']],
    [':::{tab-item} First\n:::', ['tab-item']],
    ['``` {note}\n```', ['note']],
    ['~~~{note}\n~~~', ['note']],
    ['text {figure}', []],
    ...names.map((n) => [`\`\`\`{${n}}\n\`\`\``, [n]]),
    ...names.map((n) => [`:::{${n}}\n:::`, [n]]),
    ['- :::{note}\n  :::\n\n1. ```{tip}\n   ```\n\n- Item\n\n  ```{warning}\n  ```', ['note', 'tip', 'warning']],
    ['> :::{note}\n> :::', ['note']],
  ],
  option: [['```{figure} x\n:width: 50%\n  :class: y\n```', ['width', 'class']], [':::{note}\n:::', []], ['Text\n:key: value', []], ['- :::{note}\n  :class: x\n  :::', ['class']], ['> :::{note}\n> :class: x\n> :::', ['class']]],
  label: [['(intro)=', ['intro']], ['  (fig.1|a)=', ['fig.1|a']], ['(a b)=', []], ['(café)=', []], ['- (a)=\n\n> (b)=', ['a', 'b']]],
  math: [['a $x^2$ and $ y $, not $$z$$', ['x^2', ' y ']], ['cost $5 or $10', ['5 or ']], ['`$x$`', []]],
  citation: [['As @smith2020 said; mail a@b.org', ['smith2020']], ['See @doi:10.1/x.', ['doi:10.1/x']], ['[@a; @b, p. 3]', ['a', 'b']], ['`@x`', []]],
  comment: [['% a comment', ['% a comment']], ['Text\n% a comment', ['% a comment']], ['- % a\n\n  % b\n  not % c\n\n> % d', ['% a', '% b', '% d']], ['Text.\n\n    % code', []], ['```text\n% code\n```', []]],
  'block-break': [['  +++ {"a": 1}', ['+++ {"a": 1}']], ['- Item\n\n    +++\n\n> +++', ['+++', '+++']], ['Text.\n\n    +++', []]],
  substitution: [['Hi {{ name }}', [' name ']], ['`{{ x }}`', []]],
  footnote: [['Text[^1] and [^a-b].\n\n[^1]: Def.', ['1', 'a-b', '1']], ['[^a b]', []]],
} satisfies Record<string, [string, string[]][]>;
