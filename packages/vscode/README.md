# MyST Syntax for VS Code

Highlights MyST Markdown on top of VS Code's built-in Markdown highlighting.
Roles, directives, directive options, labels, math, citations and comments get their own colours.

It is the TextMate grammar from the [`myst-syntax`](../syntax) package, with nothing else: no activation code, no settings.
If you use the MyST Author extension you don't need to install this one, since MyST Author depends on it.

## Install

Once it is published, search for "MyST Syntax" in the Extensions view.

To install it from source, build the `.vsix` from the repository root, then install it from the Extensions view's "Install from VSIX..." menu:

```sh
npm install
npm run package -w packages/vscode
```

## Build

`npm run build` copies `myst.tmLanguage.json` and `LICENSE` in from the repository, since the grammar lives in `packages/syntax`.
`npm run package` runs the build and then `vsce package`, which writes `myst-syntax.vsix`.
