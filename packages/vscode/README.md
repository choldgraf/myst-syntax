# MyST Syntax for VS Code

Highlights MyST Markdown on top of VS Code's built-in Markdown highlighting.
Roles, directives, directive options, labels, math, citations and comments get their own colours.

It is the TextMate grammar from the [`myst-syntax`](../syntax/README.md) package, with nothing else: no activation code, no settings.
Its id is `myst-author.myst-syntax-vscode`, the publisher and name in `package.json`; the [MyST Language Server](https://github.com/choldgraf/mystmd-lsp) extension depends on that id, so VS Code installs this one with it.

## Install

Until it is published, build it from source as below; after that, search for "MyST Syntax" in the Extensions view.

To install it from source, [build](#build) the `.vsix`, then install it from the Extensions view's "Install from VSIX..." menu.

## Build

From the repository root:

```sh
npm install
npm run package -w packages/vscode    # writes myst-syntax.vsix
```

`npm run build` copies `myst.tmLanguage.json` and `LICENSE` in from the repository, since the grammar lives in `packages/syntax`.
`npm run package` runs the build and then `vsce package`.

Releasing is described in the [repository README](../../README.md#releasing).
