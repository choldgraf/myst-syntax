# jupyterlab-myst-syntax

MyST Markdown syntax highlighting in JupyterLab 4, in notebook Markdown cells and in `.md` file editors.

It highlights the MyST syntax marked ✓ in the CodeMirror column of [the syntax package's table](https://github.com/choldgraf/myst-syntax/tree/main/packages/syntax#readme).
It works on top of Lab's own Markdown highlighting.
It only highlights, and [MyST Author](https://github.com/choldgraf/myst-author)'s Lab extension handles preview and cross-references.

## Install

It isn't published yet, so build it from source as below.
Once it is:

```sh
pip install jupyterlab-myst-syntax
```

## How it works

Lab's notebook Markdown cells and `.md` files both use its `ipythongfm` language.
Lab registers that language itself, and the language registry has no supported way to replace it.
Editors load the language from the registration's `support` field when they open.
So the extension rebuilds Lab's Markdown parser with [`myst-syntax/codemirror`](https://github.com/choldgraf/myst-syntax/tree/main/packages/syntax#readme) added, and sets `support` to the rebuilt parser.

## Build

You need Node 24 and a `python` with JupyterLab installed, because `build.mjs` reads Lab's list of shared packages from that JupyterLab.
From the repository root:

```sh
npm install
npm run build -w packages/jupyterlab    # writes jupyterlab_myst_syntax/labextension
```

To try it in your own Lab without a wheel:

```sh
mkdir -p "$(jupyter --data-dir)/labextensions"
ln -sfn "$PWD/packages/jupyterlab/jupyterlab_myst_syntax/labextension" "$(jupyter --data-dir)/labextensions/jupyterlab-myst-syntax"
```

Rebuild and reload the page after changes.

Releasing is described in the [repository README](https://github.com/choldgraf/myst-syntax#releasing).
