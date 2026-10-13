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
  ],
  option: [['```{figure} x\n:width: 50%\n  :class: y\n```', ['width', 'class']], [':::{note}\n:::', []], ['Text\n:key: value', []]],
  label: [['(intro)=', ['intro']], ['  (fig.1|a)=', ['fig.1|a']], ['(a b)=', []], ['(café)=', []]],
} satisfies Record<string, [string, string[]][]>;
