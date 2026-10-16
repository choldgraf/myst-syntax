# myst-syntax

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/choldgraf/myst-syntax)
[![Launch on Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/choldgraf/myst-syntax/main?urlpath=lab/tree/demo/index.md)

Syntax highlighting for [MyST Markdown](https://mystmd.org), on top of an editor's Markdown highlighting.
The highlighting lives in `packages/syntax`, and there are three ways to get it: the npm package, a VS Code extension and a JupyterLab extension.

| Package | Install | Use it for |
| --- | --- | --- |
| [`myst-syntax`](packages/syntax/README.md) | `npm install myst-syntax` | The TextMate grammar and CodeMirror mode, for your own extension, editor or Shiki site |
| [MyST Syntax for VS Code](packages/vscode/README.md) | Search "MyST Syntax" in the Extensions view | Highlighting in VS Code |
| [`jupyterlab-myst-syntax`](packages/jupyterlab/README.md) | `pip install jupyterlab-myst-syntax` | Highlighting in JupyterLab's notebook cells and Markdown editors |

The npm package is published.
The two extensions aren't yet, so build them from this repo as their READMEs say.
Or try them on `demo/index.md` without installing anything: the Codespaces badge above opens it in VS Code, and the Binder badge in JupyterLab.
The [MyST Language Server](https://github.com/choldgraf/mystmd-lsp) and [MyST Author](https://github.com/choldgraf/myst-author) extensions build on these instead of shipping their own highlighting.

See the [roadmap](ROADMAP.md) for what's next, and [what we learned](docs/findings.md) for why it works the way it does.

## Develop

You need Node 24 or later, which runs the TypeScript files directly, and a `python` with JupyterLab installed for the JupyterLab build.
The repo is an npm workspace, so run everything from the root:

- `npm install`: install the dependencies for every package.
- `npm test`: check the grammar and the CodeMirror mode against the examples in `packages/syntax/src/cases.ts`.
- `npm run conformance`: [compare both with mystmd's parser](packages/syntax/CONTRIBUTING.md#conformance).
- `npm run typecheck`: type-check every package.
- `npm run build`: build every package.
- `npm run docs`: build the docs site, and `npm run docs:live` previews it.

Add `-w packages/<name>` to run a script in one package.
CI (`.github/workflows/test.yml`) runs all of these, then packages the `.vsix` and the Python wheel.

Where things live:

- `demo/`: one file with each kind of syntax, which Codespaces and Binder open.
- `docs/`: the [docs site](https://chrisholdgraf.com/myst-syntax/), which includes the READMEs, the roadmap and `findings.md`.

Each package README says how to build that package.

## Releasing

Each package is released on its own, with its own version.
The extensions build from the grammar in the working tree, so a grammar change usually means releasing all three.

1. Bump the version: `npm version <version> --no-git-tag-version -w packages/<name>`.
2. Commit the changes to `package.json` and `package-lock.json`, and push to main.
3. Run the Release workflow (`.github/workflows/release.yml`) from the Actions tab and pick the package, or run `gh workflow run release.yml -f package=<name>`.

The workflow publishes the package at the version in its `package.json`, then tags the commit `<name>-v<version>` and creates a GitHub release with generated notes.

Each package needs one thing set up on its registry:

- `syntax`: npm's [trusted publisher](https://docs.npmjs.com/trusted-publishers) for `release.yml`.
- `vscode`: `VSCE_PAT` and `OVSX_PAT` repository secrets for the `myst-author` publisher on the Marketplace and on Open VSX, which code-server uses.
- `jupyterlab`: PyPI's [trusted publisher](https://docs.pypi.org/trusted-publishers/) for `release.yml`.
