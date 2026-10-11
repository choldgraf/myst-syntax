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

TextMate leaves backtick code directives such as `{code}`, `{code-cell}` and `{math}` to Markdown, so their names and contents stay plain.

For TextMate, it aims to replace the older, unmaintained [`vscode-myst-syntax`](https://github.com/chrisjsewell/vscode-myst-syntax) grammar.
It doesn't yet highlight the code inside directives like `{code-cell} python`, which `vscode-myst-syntax` does.
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
import { EditorView } from '@codemirror/view';
import { myst } from 'myst-syntax/codemirror';

new EditorView({ extensions: [markdown(), myst()] });
```

It adds a `cm-myst-<name>` class to each match, such as `cm-myst-role`, with colours for light and dark themes.
It skips Markdown code, so `@property` in a Python block isn't a citation.

The CodeMirror extension is TypeScript, so use it from a bundler that compiles TypeScript in `node_modules`, such as Vite or esbuild.

## Develop

You need Node 24 or later, which runs the TypeScript files directly.

- `npm install`: install the dependencies.
- `npm test`: check both parts against MyST examples. The grammar is tested with `vscode-textmate`, the library VS Code uses.
