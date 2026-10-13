# Roadmap

Next steps, most important first.
Keep it small, editor-neutral and BSD-3, so it can move to [jupyter-book](https://github.com/jupyter-book) (step 5).
[What we learned](docs/findings.md) has the conformance numbers and design notes.

## Where it fits

- The CodeMirror part is for JupyterLab and the many web editors that use CodeMirror.
  No JupyterLab extension uses it yet.
- The TextMate grammar is for VS Code.
  Docs sites that highlight with Shiki can use it too, as the [README](README.md) shows.
  Sphinx and mystmd sites don't use it: MyST-Parser's Sphinx docs use a Pygments lexer, and myst-theme uses highlight.js.

## 1. Cheap fixes

Done: both parts highlight directives inside list items, and TextMate also highlights comments and block breaks there.

## 2. Both parts highlight the same things

Done: both parts highlight inline math, citations, comments, block breaks, substitutions and footnote references.
Left: CodeMirror doesn't highlight display math or YAML options in a directive, as the [README](README.md) shows.
Both span lines, and CodeMirror's Markdown parser has no node for either, so they need block parsers, which fit with step 4.
Both parts are checked against the shared examples in `src/cases.ts`; add new syntax there first, then fill in the gaps.
[myst-parser-unified](https://github.com/choldgraf/myst-parser-unified)'s syntax edge cases are a good source of tricky examples.

## 3. A working Shiki recipe

Done: the [README](README.md) has the recipe, and `src/shiki.test.ts` pins it.
The load order matters because of a Shiki bug: `Registry.loadLanguage` in `@shikijs/primitive` rebuilds Markdown without its injections when it loads a second language from Markdown's `embeddedLangsLazy` list.
Left: report it to Shiki.

Then, if docs sites ask for it, add a `myst` language so ```` ```myst ```` blocks highlight.
It needs an `injections` key aimed at its own scope.
A grammar that includes the Markdown grammar and adds MyST patterns doesn't work, because Markdown's paragraph rule wins over inline patterns like roles.

## 4. Lezer, when something needs a syntax tree

Rewrite the CodeMirror part as [`@lezer/markdown`](https://github.com/lezer-parser/markdown) extensions when someone needs a syntax tree.
Examples: folding directives, or letting [jupyterlab-myst](https://github.com/jupyter-book/jupyterlab-myst) read the document structure.
Highlighting alone doesn't need it.

## 5. Move to jupyter-book and publish

Once 1 and 2 are done, propose moving the repo to the jupyter-book organization, and publish it to npm from there.
Publishing needs a build step that emits JavaScript and `.d.ts` files, because Node doesn't strip types inside `node_modules`.

## Later, if asked

- A [tree-sitter](https://tree-sitter.github.io) grammar, for Neovim, Helix and Zed.
- GitHub highlighting through [Linguist](https://github.com/github-linguist/linguist), which has no MyST entry. It needs evidence of wide use, and MyST files share the `.md` extension with Markdown.
