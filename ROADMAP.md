# Roadmap

Next steps, most important first.
Keep it small, editor-neutral and CC0, so it can move to [jupyter-book](https://github.com/jupyter-book) (step 5).
[What we learned](docs/findings.md) has the conformance numbers and design notes.

## Where it fits

The CodeMirror part is for JupyterLab and the many web editors that use CodeMirror.
[`jupyterlab-myst-syntax`](packages/jupyterlab/README.md) adds it to JupyterLab.

The TextMate grammar is for VS Code, where the [VS Code extension](packages/vscode/README.md) ships it.
Docs sites that highlight with Shiki can use it too, as the [package README](packages/syntax/README.md#using-with-shiki) shows.
Sphinx and mystmd sites don't use it: MyST-Parser's Sphinx docs use a Pygments lexer, and myst-theme uses highlight.js.

## 1. Cheap fixes

Done: both parts highlight MyST inside list items and blockquotes, as the [package README](packages/syntax/README.md) says.

## 2. Both parts highlight the same things

Done: both parts highlight inline math, citations, comments, block breaks, substitutions and footnote references.
Left: CodeMirror doesn't highlight display math or YAML options in a directive, as the [package README](packages/syntax/README.md) shows.
Highlighting those needs a [block parser](docs/findings.md#why-textmate-and-codemirror-need-different-approaches), which is step 4.
Both parts are checked against the shared examples in `packages/syntax/src/cases.ts`.
Add new syntax there first, then fill in the gaps.
[myst-parser-unified](https://github.com/choldgraf/myst-parser-unified)'s syntax edge cases are a good source of tricky examples.

## 3. A working Shiki recipe

Done: the [package README](packages/syntax/README.md#using-with-shiki) has the recipe, and `packages/syntax/src/shiki.test.ts` pins it.
The load order works around [a Shiki bug](docs/findings.md#shiki-drops-markdowns-injections).
Left: report it to [Shiki](https://github.com/shikijs/shiki).

[mystmd#1683](https://github.com/jupyter-book/mystmd/issues/1683) proposes Shiki for mystmd sites.
If it lands, add a `myst` language so ```` ```myst ```` blocks highlight.
It needs an `injections` key aimed at its own scope.
A grammar that includes the Markdown grammar and adds MyST patterns doesn't work, because Markdown's paragraph rule wins over inline patterns like roles.

## 4. Lezer, when something needs a syntax tree

Rewrite the CodeMirror part as [`@lezer/markdown`](https://github.com/lezer-parser/markdown) extensions when a tool needs a syntax tree.
[What we learned](docs/findings.md#when-a-lezer-or-tree-sitter-grammar-would-be-worth-it) says what that would unlock.

## 5. Move to jupyter-book

Once step 2 is done, propose moving the repo to the jupyter-book organization.
The three packages [release from this repo](README.md#releasing), so the npm and PyPI trusted publishers would need to point at the new one.
The Marketplace publisher `myst-author` would need a decision too, since the MyST Language Server extension depends on the extension id `myst-author.myst-syntax-vscode`.

## Later, if asked

- A [tree-sitter](https://tree-sitter.github.io) grammar, for Neovim, Helix and Zed.
- GitHub highlighting through [Linguist](https://github.com/github-linguist/linguist), which has no MyST entry.
  Linguist asks for evidence of wide use, and MyST files share the `.md` extension with Markdown.
