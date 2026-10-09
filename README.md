# myst-syntax

Syntax highlighting for [MyST Markdown](https://mystmd.org), on top of an editor's Markdown highlighting.

It has two parts:

- `myst.tmLanguage.json`: a [TextMate grammar](https://macromates.com/manual/en/language_grammars) for editors like VS Code.
  It injects MyST into the editor's Markdown grammar.
- `myst-syntax/codemirror`: a [CodeMirror 6](https://codemirror.net) extension to use with `markdown()`.

They highlight different syntax:

| Syntax | TextMate | CodeMirror |
| --- | --- | --- |
| Roles, directives, options and labels | ✓ | ✓ |
| Comments (`%`) and block breaks (`+++`) | ✓ | |
| Substitutions (`{{ x }}`) and footnote references | ✓ | |
| YAML options in a directive | ✓ | |
| Inline math (`$x$`) | | ✓ |
| Citations (`@key`) | | ✓ |

There's no other CodeMirror package for MyST.
For TextMate, it aims to replace the older, unmaintained [`vscode-myst-syntax`](https://github.com/chrisjsewell/vscode-myst-syntax) grammar.
The goal is to move it to the [jupyter-book](https://github.com/jupyter-book) organization; see the [roadmap](ROADMAP.md).

## Install it

It isn't on npm, so install it from GitHub:

```sh
npm install github:choldgraf/myst-syntax
```

## Use it

In a VS Code extension's `package.json`:

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
import { myst } from 'myst-syntax/codemirror';

new EditorView({ extensions: [markdown(), myst()] });
```

The CodeMirror extension is TypeScript, so use it from a bundler.

## Develop

You need Node 24 or later, which runs the TypeScript files directly.

- `npm install`: install the dependencies.
- `npm test`: check both parts against MyST examples. The grammar is tested with `vscode-textmate`, the library VS Code uses.
