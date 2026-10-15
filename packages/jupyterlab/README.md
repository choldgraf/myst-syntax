# jupyterlab-myst-syntax

MyST Markdown syntax highlighting in JupyterLab 4, in notebook Markdown cells and in `.md` file editors.

```sh
pip install jupyterlab-myst-syntax
```

It highlights the MyST syntax in the CodeMirror column of [the syntax package's table](https://github.com/choldgraf/myst-syntax/tree/main/packages/syntax#readme), on top of Lab's own Markdown highlighting.
It only highlights.
[MyST Author](https://github.com/choldgraf/myst-author)'s Lab extension handles preview and cross-references.

## How it works

Lab's notebook Markdown cells and `.md` files both use its `ipythongfm` language.
Lab registers it itself, and the language registry can't replace it.
Editors load that language from the registration's `support` field when they open, so the extension rebuilds Lab's Markdown parser with [`myst-syntax/codemirror`](https://github.com/choldgraf/myst-syntax/tree/main/packages/syntax#readme) added and sets `support` to it.

## Build it

You need Node 24 and a `python` with JupyterLab installed, because `build.mjs` reads Lab's list of shared packages from it.
From the repo root:

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

## Release it

The Python build skips the JavaScript build when `jupyterlab_myst_syntax/labextension/package.json` exists, and the sdist includes that folder.
Build the labextension as above, then the Python distributions from this folder:

```sh
cd packages/jupyterlab
uv build                                 # or: python -m build
uv publish                               # or: twine upload dist/*
```

Inside the checkout, `pip install .` works without building the labextension first too; the Python build then runs `npm run build` itself, which is slower.
The version comes from `package.json`.
