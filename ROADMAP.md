# Roadmap

Next steps, most important first.
Keep it small, editor-neutral and BSD-3, so it can move to [jupyter-book](https://github.com/jupyter-book) (step 6).

## Where it fits

- The CodeMirror part is for JupyterLab and the many web editors that use CodeMirror.
  JupyterLab accepts CodeMirror extensions like this one as they are, but no JupyterLab extension uses it yet.
- The TextMate grammar is for VS Code.
  Docs sites that highlight with Shiki could use it once step 4 works.
  Sphinx and mystmd sites don't use it: MyST-Parser's Sphinx docs use a Pygments lexer, and myst-theme uses highlight.js.

## 1. Highlight the code inside code directives

`vscode-myst-syntax` highlights the code in `{code-cell} python`, `{code} js` and similar directives in that language.
Ours leaves that code plain.
Do the same: for each common language, a pattern that includes its grammar (`source.python` and so on) between the fences.
Its approach is worth reading, but it's Apache-2.0, so credit it if any of it is copied.

## 2. Cheap CodeMirror fixes

None of these need a parser:

- Colours are hard-coded for light themes. Use `&light` and `&dark` in `baseTheme`.
- Every pattern matches inside code blocks, so a Python `@property` shows as a citation. Skip ranges that `@codemirror/lang-markdown`'s syntax tree marks as code.
- The option pattern matches any `:name:` line, not only lines after a directive's opening fence.

## 3. Both parts highlight the same things

The two parts highlight different syntax, as the [README](README.md) shows.
Write one example document that covers everything, check both parts against it, and fill in the gaps.
[myst-parser-unified](https://github.com/choldgraf/myst-parser-unified)'s syntax edge cases are a good source of tricky examples.

## 4. A working Shiki recipe

The grammar has `name` and `injectTo`, which Shiki needs to inject it into Markdown.
Tried by hand, it works for some load orders and not others: `['yaml', 'markdown', myst]` works, `['markdown', 'yaml', myst]` doesn't.
Find out why, document the recipe, and report it to Shiki if it's a bug.

Then, if docs sites ask for it, add a `myst` language so ```` ```myst ```` blocks highlight.
It needs an `injections` key aimed at its own scope.
A grammar that includes the Markdown grammar and adds MyST patterns doesn't work, because Markdown's paragraph rule wins over inline patterns like roles.

## 5. Lezer, when something needs a syntax tree

Rewrite the CodeMirror part as [`@lezer/markdown`](https://github.com/lezer-parser/markdown) extensions when someone needs a syntax tree.
Examples: folding directives, or letting [jupyterlab-myst](https://github.com/jupyter-book/jupyterlab-myst) read the document structure.
Highlighting alone doesn't need it.

## 6. Move to jupyter-book and publish

Once 1–3 are done, propose moving the repo to the jupyter-book organization, and publish it to npm from there.
Publishing needs a build step that emits JavaScript and `.d.ts` files, because Node doesn't strip types inside `node_modules`.

## Later, if asked

- A [tree-sitter](https://tree-sitter.github.io) grammar, for Neovim, Helix and Zed.
- GitHub highlighting through [Linguist](https://github.com/github-linguist/linguist), which has no MyST entry. It needs evidence of wide use, and MyST files share the `.md` extension with Markdown.
