# Roadmap

What this repo needs to do to be as useful as possible, most important first.
Today it's two highlighters copied out of MyST Author, each written for one editor.
The goal is to move it to the [jupyter-book](https://github.com/jupyter-book) organization once it's useful beyond MyST Author, so keep it small, editor-neutral and BSD-3.

## Where it fits

- **CodeMirror 6:** no MyST package exists, so this is the clearest gap. JupyterLab and many web editors use CodeMirror, and JupyterLab accepts CodeMirror extensions like this one as they are.
- **TextMate:** the older [`chrisjsewell/vscode-myst-syntax`](https://github.com/chrisjsewell/vscode-myst-syntax) grammar (about 60k installs through the MyST VS Code extension) has been unmaintained since March 2023 and isn't part of jupyter-book.
  This grammar should replace it, so it needs to match what that one does well, such as highlighting the code inside `{code-cell} python`.
- **Elsewhere:** MyST-Parser's Sphinx docs use a Pygments lexer, and the mystmd docs highlight code with Prism/highlight.js (through myst-theme), so neither would use a TextMate grammar.

## 1. Highlight the code inside code directives

The older grammar highlights the code in `{code-cell} python`, `{code} js` and similar directives in that language; ours leaves it plain.
Do the same: for each common language, a pattern that includes its grammar (`source.python` and so on) between the fences.
Its approach is worth reading, but it's Apache-2.0, so credit it if any of it is copied.

## 2. Cheap CodeMirror fixes

None of these need a parser:

- Colours are hard-coded for light themes. Use `&light` and `&dark` in `baseTheme`.
- Roles and options are matched inside code blocks. Skip ranges that `@codemirror/lang-markdown`'s syntax tree marks as code.
- The option pattern matches any `:name:` line, not only lines after a directive's opening fence.

## 3. Both parts highlight the same things

Today they cover different syntax:

| Syntax | TextMate | CodeMirror |
| --- | --- | --- |
| Roles, directives, options, labels | ✓ | ✓ |
| Inline math (`$x$`) | | ✓ |
| Citations (`@key`) | | ✓ |
| Comments (`%`), block breaks (`+++`) | ✓ | |
| Substitutions (`{{ x }}`), footnote references | ✓ | |
| YAML options in a directive | ✓ | |
| Code inside code directives | | |

Write one example document that covers everything, check both parts against it, and fill in the gaps.
[myst-parser-unified](https://github.com/choldgraf/myst-parser-unified)'s syntax edge cases are a good source of tricky examples.

## 4. A working Shiki recipe

The grammar has `name` and `injectTo`, which Shiki needs to inject it into Markdown.
In our tests that works for some load orders and not others: `['yaml', 'markdown', myst]` works, `['markdown', 'yaml', myst]` doesn't.
Find out why, document the recipe, and report it to Shiki if it's a bug.

Then, if docs sites ask for it, add a `myst` language so ```` ```myst ```` blocks highlight.
It needs an `injections` key aimed at its own scope: including the Markdown grammar plus MyST patterns doesn't work, because Markdown's paragraph rule wins over inline patterns like roles.

## 5. Lezer, when something needs a syntax tree

Rewrite the CodeMirror part as [`@lezer/markdown`](https://github.com/lezer-parser/markdown) extensions when a user needs more than highlighting: folding directives, or other extensions reading the structure (for example jupyterlab-myst).
Highlighting alone doesn't need it.

## 6. Move to jupyter-book and publish

Once 1–3 are done, propose moving the repo to the jupyter-book organization (myst-author's upstream proposal U3), and publish it to npm from there.
The CodeMirror extension is TypeScript, and Node doesn't strip types inside `node_modules`, so publishing needs a build step that emits JavaScript and `.d.ts` files.

## Later, if asked

- A [tree-sitter](https://tree-sitter.github.io) grammar, for Neovim, Helix and Zed.
- GitHub highlighting through [Linguist](https://github.com/github-linguist/linguist), which has no MyST entry. It needs evidence of wide use, and MyST files share the `.md` extension with Markdown.
