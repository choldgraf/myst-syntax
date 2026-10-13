# myst-syntax

Syntax highlighting for [MyST Markdown](https://mystmd.org), on top of an editor's Markdown highlighting.

It has two parts:

- `myst.tmLanguage.json`: a [TextMate grammar](https://macromates.com/manual/en/language_grammars) for editors like VS Code.
  It injects MyST into the editor's Markdown grammar.
- `myst-syntax/codemirror`: a [CodeMirror 6](https://codemirror.net) extension to use with `markdown()`.

Both parts take the role and directive name pattern, the label pattern and the list of code directives from `myst-syntax/rules`, which other tools can import too.

They highlight different syntax:

| Syntax | TextMate | CodeMirror |
| --- | --- | --- |
| Roles, directives, options and labels | ✓ | ✓ |
| Comments (`%`) and block breaks (`+++`) | ✓ | ✓ |
| Substitutions (`{{ x }}`) and footnote references (`[^1]`) | ✓ | ✓ |
| YAML options in a directive | ✓ | No: Markdown parses them as headings or code, so this needs a block parser, not just `@codemirror/lang-yaml` |
| Inline math (`$x$`) | ✓ | ✓ |
| Display math (`$$`) | ✓ | No: it spans lines, so it needs a block parser too |
| Citations (`@key`, `[@a; @b]`) | ✓ | ✓ |
| Code in code directives, like `{code-cell} python` | ✓ | ✓ |

Both parts highlight directives in backtick, tilde and colon fences.
Directives, labels, comments and block breaks are highlighted at the top level, inside list items and inside blockquotes.
TextMate highlights code directives in common languages, such as Python, R and JavaScript.
In TextMate, code directives in other languages, or without one, stay plain, and so do `{math}`, `{mermaid}` and `{raw}`.

For TextMate, it aims to replace the older, unmaintained [`vscode-myst-syntax`](https://github.com/chrisjsewell/vscode-myst-syntax) grammar.
See the [roadmap](ROADMAP.md) for what's next.

## Install it

It isn't on npm, so install it from GitHub:

```sh
npm install github:choldgraf/myst-syntax
```

## Use it

In a VS Code extension, copy `node_modules/myst-syntax/myst.tmLanguage.json` into the extension when you build it.
Then add the copy to the extension's `package.json`:

```json
"contributes": {
  "grammars": [
    { "scopeName": "text.myst.injection", "path": "./myst.tmLanguage.json", "injectTo": ["text.html.markdown"] }
  ]
}
```

In CodeMirror:

```ts
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { myst, mystCode } from 'myst-syntax/codemirror';

new EditorView({ extensions: [markdown({ codeLanguages: languages, extensions: [mystCode(languages)] }), myst()] });
```

`myst()` adds a `cm-myst-<name>` class to each match, such as `cm-myst-role`, with colours for light and dark themes.
It skips code, so `@property` in a Python block isn't a citation.
`mystCode` highlights code directives in their language, as `codeLanguages` does for plain ```` ```python ```` blocks.
It also parses colon-fenced code directives, like `:::{code-cell} python`, as code, which Markdown doesn't.
Leave out `codeLanguages` and `mystCode` if you don't want code highlighted.

The CodeMirror extension is TypeScript, so use it from a bundler that compiles TypeScript in `node_modules`, such as Vite or esbuild.

### Using with Shiki

[Shiki](https://shiki.style) can load the grammar and inject it into Markdown:

```ts
import { createHighlighter } from 'shiki';
import myst from 'myst-syntax/myst.tmLanguage.json' with { type: 'json' };

const highlighter = await createHighlighter({ themes: ['github-light'], langs: ['yaml', 'markdown', myst] });
highlighter.codeToHtml(src, { lang: 'markdown', theme: 'github-light' });
```

Load `yaml` first, then `markdown`, then the grammar, and nothing else.
This is a Shiki bug: once a second language that Markdown embeds lazily, like `yaml` or `python`, is loaded, Shiki rebuilds Markdown without its injections.
To load more languages, pass Markdown with its lazy list emptied, and then the order doesn't matter:

```ts
import markdown from '@shikijs/langs/markdown';

langs: ['yaml', 'python', { ...markdown[0], embeddedLangsLazy: [] }, myst]
```

## Develop

You need Node 24 or later, which runs the TypeScript files directly.

- `npm install`: install the dependencies.
- `npm test`: check both parts against MyST examples. The grammar is tested with `vscode-textmate`, the library VS Code uses.
- `npm run grammar`: regenerate `myst.tmLanguage.json`. Edit `grammar.mjs`, not the JSON.
- `npm run conformance`: compare both parts with mystmd, below.
- `npm run build`: compile to `dist/`, which is what other packages import. Installing from GitHub runs this automatically.

### Conformance

`npm run conformance` checks that both parts find the same role names, directive names and target labels as mystmd's parser.
It runs on the [myst-spec](https://github.com/jupyter-book/myst-spec) examples, prints each miss and a table of matched, missed and excluded examples, and fails if any example is missed.
Differences in `{math}`, `{raw}`, `{mermaid}` and code directives count as excluded, not missed, since the parts deliberately treat them as math or code rather than MyST.
CI runs it after `npm test`.

To also check a folder of your own MyST projects, point `MYST_CORPUS` at it:

```sh
MYST_CORPUS=path/to/projects npm run conformance
```

This reads every `.md` file and the Markdown cells of every `.ipynb` file, skipping `node_modules` and `_build`.
Corpus misses are printed, but don't make the command fail.
