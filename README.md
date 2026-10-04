# myst-syntax

Syntax highlighting for [MyST Markdown](https://mystmd.org): roles, directives, options, labels, comments and more, on top of Markdown.

It has two parts:

- `myst.tmLanguage.json`: a [TextMate grammar](https://macromates.com/manual/en/language_grammars) that injects MyST into an editor's Markdown grammar, as VS Code does.
- `myst-syntax/codemirror`: a [CodeMirror 6](https://codemirror.net) extension to use with `markdown()`.

This is an early version, moved out of [MyST Author](https://github.com/choldgraf/myst-author).
There's no other CodeMirror package for MyST.
For TextMate, it aims to replace the older, unmaintained [`vscode-myst-syntax`](https://github.com/chrisjsewell/vscode-myst-syntax) grammar.
The goal is to move it to the [jupyter-book](https://github.com/jupyter-book) organization; see the [roadmap](ROADMAP.md).

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
