// Writes myst.tmLanguage.json. Edit this file, not the JSON, then run `npm run grammar`.
import { writeFileSync } from 'node:fs';
import { codeDirectives, labelChars, nameChars } from './src/rules.ts';

// Code directives like {code-cell} python. TextMate can only include a grammar by name, so each language has its own rule.
const languages = [
  ['python', 'python3?|ipython3?|py', 'source.python'],
  ['r', 'r|ir', 'source.r'],
  ['julia', 'julia(?:-[\\d.]+)?|jl', 'source.julia'],
  ['javascript', 'javascript|js', 'source.js'],
  ['typescript', 'typescript|ts', 'source.ts'],
  ['shell', 'bash|sh|shell|zsh', 'source.shell'],
  ['json', 'json', 'source.json'],
  ['yaml', 'ya?ml', 'source.yaml'],
  ['sql', 'sql', 'source.sql'],
  ['html', 'html', 'text.html.basic'],
  ['css', 'css', 'source.css'],
];

const punctuation = { name: 'punctuation.definition.directive.myst' };
// Fence, braces, name and argument, the same for code and other directives.
const directiveCaptures = {
  beginCaptures: {
    1: punctuation,
    2: punctuation,
    3: { name: 'entity.name.function.directive.myst' },
    4: punctuation,
    5: { name: 'string.unquoted.argument.myst' },
  },
  endCaptures: { 0: punctuation },
};

// The closing fence is at least as long as the opening one.
const codeRule = (argument) => ({
  begin: '^\\s*(`{3,}|:{3,})\\s*(\\{)(' + codeDirectives + ')(\\})\\s*' + argument,
  end: '^\\s*\\1[`:]*\\s*$',
  ...directiveCaptures,
});

const code = {};
for (const [name, aliases, scope] of languages) {
  code[`code-${name}`] = {
    ...codeRule(`((?i:${aliases}))(?=\\s|$).*$`),
    contentName: `meta.embedded.block.${name}`,
    patterns: [{ include: '#yaml-options' }, { include: '#option' }, { include: scope }],
  };
}
code['code-other'] = {
  comment: 'Other languages, or none, stay plain.',
  ...codeRule('(.*)$'),
  contentName: 'markup.fenced_code.block.myst',
};

const grammar = {
  name: 'myst',
  scopeName: 'text.myst.injection',
  injectTo: ['text.html.markdown'],
  injectionSelector: 'L:text.html.markdown -meta.embedded -markup.inline.raw -markup.fenced_code',
  patterns: [...Object.keys(code), 'directive', 'role', 'target', 'block-break', 'comment', 'substitution', 'footnote'].map((name) => ({ include: `#${name}` })),
  repository: {
    ...code,
    directive: {
      comment: 'Backtick and colon fences. Code directives are left to the #code-* rules, which come first; {math}, {mermaid} and {raw} in backtick fences are left to Markdown, which shows their contents as plain code.',
      begin: '^\\s*(`{3,}(?!\\s*\\{(?:' + codeDirectives + '|math|mermaid|raw)\\})|:{3,})\\s*(\\{)(' + nameChars + '+)(\\})(.*)$',
      end: '^\\s*\\1[`:]*\\s*$',
      name: 'meta.directive.myst',
      ...directiveCaptures,
      patterns: [{ include: '#yaml-options' }, { include: '#option' }, { include: 'text.html.markdown' }],
    },
    option: {
      match: '^\\s*(:)([\\w-]+)(:)(?=\\s|$)',
      captures: {
        1: { name: 'punctuation.definition.option.myst' },
        2: { name: 'entity.other.attribute-name.myst' },
        3: { name: 'punctuation.definition.option.myst' },
      },
    },
    role: {
      match: '(\\{)(' + nameChars + '+)(\\})(?=`)',
      captures: {
        1: { name: 'punctuation.definition.role.myst' },
        2: { name: 'entity.name.function.role.myst' },
        3: { name: 'punctuation.definition.role.myst' },
      },
    },
    target: {
      comment: "Label characters follow mystmd's TARGET_PATTERN (markdown-it-myst).",
      match: '^\\s*(\\()(' + labelChars + '+)(\\))(=)\\s*$',
      captures: {
        1: { name: 'punctuation.definition.target.myst' },
        2: { name: 'entity.name.label.myst' },
        3: { name: 'punctuation.definition.target.myst' },
        4: { name: 'punctuation.definition.target.myst' },
      },
    },
    'block-break': {
      match: '^ {0,3}\\+\\+\\+.*$',
      name: 'meta.separator.myst',
    },
    comment: {
      match: '^ {0,3}%.*$',
      name: 'comment.line.percentage.myst',
    },
    'yaml-options': {
      begin: '^\\s*---\\s*$',
      end: '^\\s*---\\s*$|(?=^\\s*:{3,}\\s*$)',
      contentName: 'meta.embedded.block.yaml',
      beginCaptures: { 0: { name: 'punctuation.definition.options.myst' } },
      endCaptures: { 0: { name: 'punctuation.definition.options.myst' } },
      patterns: [{ include: 'source.yaml' }],
    },
    substitution: {
      match: '(\\{\\{)([^}\\n]*)(\\}\\})',
      captures: {
        1: { name: 'punctuation.definition.substitution.myst' },
        2: { name: 'variable.other.substitution.myst' },
        3: { name: 'punctuation.definition.substitution.myst' },
      },
    },
    footnote: {
      match: '\\[\\^[^\\]\\s]+\\]',
      name: 'constant.other.footnote.myst',
    },
  },
};

writeFileSync('myst.tmLanguage.json', JSON.stringify(grammar, null, 2) + '\n');
