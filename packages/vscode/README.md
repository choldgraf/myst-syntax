# MyST Syntax for VS Code

Highlights MyST Markdown on top of VS Code's built-in Markdown highlighting.
It highlights the syntax marked ✓ in the TextMate column of [the syntax package's table](https://github.com/choldgraf/myst-syntax/tree/main/packages/syntax#readme).

It is the TextMate grammar from the [`myst-syntax`](https://www.npmjs.com/package/myst-syntax) package, and nothing else.
It has no activation code and no settings.
Its id is `myst-author.myst-syntax-vscode`, the publisher and name in `package.json`.
The [MyST Language Server](https://github.com/choldgraf/mystmd-lsp) extension depends on that id, so VS Code installs this one with it.

## Install

It isn't published yet, so build and install the `.vsix` from the repository root.
Once it is, search for "MyST Syntax" in the Extensions view.

```sh
npm install
npm run package -w packages/vscode    # writes packages/vscode/myst-syntax.vsix
code --install-extension packages/vscode/myst-syntax.vsix
```

`npm run package` copies the grammar in from `packages/syntax` and `LICENSE` from the repo root, then runs `vsce package`.

Releasing is described in the [repository README](https://github.com/choldgraf/myst-syntax#releasing).
