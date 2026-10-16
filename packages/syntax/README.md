# myst-syntax

Syntax highlighting for [MyST Markdown](https://mystmd.org), on top of an editor's Markdown highlighting.

It has two parts:

- `myst.tmLanguage.json`: a [TextMate grammar](https://macromates.com/manual/en/language_grammars) for editors like VS Code.
  It injects MyST into the editor's Markdown grammar.
- `myst-syntax/codemirror`: a [CodeMirror 6](https://codemirror.net) extension to use with `markdown()`.
  [`jupyterlab-myst-syntax`](https://github.com/choldgraf/myst-syntax/blob/main/packages/jupyterlab/README.md) adds it to JupyterLab.

Both parts share the regex fragments in `myst-syntax/rules`, which other tools can import too.

They highlight different syntax:

| Syntax | TextMate | CodeMirror |
| --- | --- | --- |
| Roles, directives, options and labels | ✓ | ✓ |
| Comments (`%`) and block breaks (`+++`) | ✓ | ✓ |
| Substitutions (`{{ x }}`) and footnote references (`[^1]`) | ✓ | ✓ |
| YAML options in a directive | ✓ | No |
| Inline math (`$x$`) | ✓ | ✓ |
| Display math (`$$`) | ✓ | No |
| Citations (`@key`, `[@a; @b]`) | ✓ | ✓ |
| Code in code directives, like `{code-cell} python` | ✓ | ✓ |

[What we learned](https://github.com/choldgraf/myst-syntax/blob/main/docs/findings.md#why-textmate-and-codemirror-need-different-approaches) says why CodeMirror skips YAML options and display math.

Both parts handle backtick, tilde and colon fences, at the top level and inside lists and blockquotes.
TextMate highlights code directives in common languages like Python, and leaves other code, `{math}`, `{mermaid}` and `{raw}` plain.

The TextMate grammar takes inspiration from chrisjsewell's [`vscode-myst-syntax`](https://github.com/chrisjsewell/vscode-myst-syntax).
See the [roadmap](https://github.com/choldgraf/myst-syntax/blob/main/ROADMAP.md) for what's next, and [what we learned](https://github.com/choldgraf/myst-syntax/blob/main/docs/findings.md) for why it works the way it does.
To work on the package itself, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Install it

Install it from npm:

```sh
npm install myst-syntax
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

The repo's own [VS Code extension](https://github.com/choldgraf/myst-syntax/blob/main/packages/vscode/README.md) does this, copying the grammar from `packages/syntax`.

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

### Using with Shiki

[Shiki](https://shiki.style) can load the grammar and inject it into Markdown:

```ts
import { createHighlighter } from 'shiki';
import myst from 'myst-syntax/myst.tmLanguage.json' with { type: 'json' };

const highlighter = await createHighlighter({ themes: ['github-light'], langs: ['yaml', 'markdown', myst] });
highlighter.codeToHtml(src, { lang: 'markdown', theme: 'github-light' });
```

Load `yaml` first, then `markdown`, then the grammar, and nothing else.
The order works around a Shiki bug, described in [what we learned](https://github.com/choldgraf/myst-syntax/blob/main/docs/findings.md#shiki-drops-markdowns-injections).
To load more languages, pass Markdown with its lazy list emptied, and then the order doesn't matter:

```ts
import markdown from '@shikijs/langs/markdown';

langs: ['yaml', 'python', { ...markdown[0], embeddedLangsLazy: [] }, myst]
```
