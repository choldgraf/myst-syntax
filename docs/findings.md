# What we learned

This page records what building myst-syntax taught us about highlighting MyST.
For what each part highlights, see the table in the [package README](https://github.com/choldgraf/myst-syntax/blob/main/packages/syntax/README.md).

## What regex highlighters can and can't do for MyST

Both parts, the TextMate grammar and the CodeMirror extension, are regular expressions layered on an editor's Markdown highlighting.
Each pattern looks at one line and has no memory of earlier lines.
Patterns for block syntax, like directive fences and labels, are anchored to the start of the line.

That works well for syntax that announces itself on one line.
Roles, directive fences, labels, comments, citations and inline math can each be recognised from the line alone.
For example, ``{ref}`x` `` marks a role, and `(intro)=` on its own line marks a label.

It works badly for syntax whose meaning depends on what came before.
`:class: tip` is an option only on the lines right after a directive's opening fence.
`---` starts YAML options only right after the fence.
Elsewhere, it's a heading underline or a thematic break (a horizontal rule).
A directive's body is MyST again, so it can hold more directives with their own options, nested to any depth.
A regex can't count fences or know which directive it's inside, so directive bodies and options are the hard part.
TextMate gets a little state from begin and end rules.
CodeMirror gets some from Markdown's syntax tree.
Neither gets a real tree of directives.

Some directives are left alone on purpose.
The body of `{math}` is LaTeX, and the body of `{mermaid}` is Mermaid.
`{raw}` holds whatever format it targets, and code directives hold code in another language.
Highlighting MyST inside them would be wrong.
TextMate leaves `{math}`, `{mermaid}` and `{raw}` plain in backtick and tilde fences, as the [package README](https://github.com/choldgraf/myst-syntax/blob/main/packages/syntax/README.md) says.
In colon fences, and everywhere in CodeMirror, MyST inside `{math}`, `{mermaid}` and `{raw}` is still highlighted.
Neither part highlights MyST in the code of a code directive.

## Conformance results

`npm run conformance` compares each part with mystmd's parser, as [CONTRIBUTING](https://github.com/choldgraf/myst-syntax/blob/main/packages/syntax/CONTRIBUTING.md#conformance) describes.

myst-spec is the MyST specification's set of test cases.
Both parts match every myst-spec example that isn't excluded.
A corpus of real projects, like the mystmd and jupyter-book docs, turns up misses.
Run `npm run conformance` for the current numbers.

Most corpus misses are noise from the comparison, not highlighting bugs:

- `{myst}` example directives keep their body as source, but both parts highlight the MyST inside them.
- `{index}` adds targets with no label, which no highlighter can match.

A few misses are real:

- Directives and roles with inline options aren't highlighted, because the name pattern stops at the space.
  Examples are `:::{note .dropdown}` and ``{span .red}`x` ``.
- CodeMirror doesn't see a code fence nested inside a backtick directive as code, so it highlights the MyST in it.

## Why TextMate and CodeMirror need different approaches

TextMate's grammar is injected into the editor's Markdown grammar.
Injections run after Markdown's list and blockquote rules have consumed a line's markers and indentation.
So inside `- ` or `> `, the scanner starts mid-line, where `^` never matches.
Every line-anchored rule starts with `(?:^|\G)` instead, since `\G` matches where Markdown left off.
The injection selector also excludes `markup.raw.block`, so indented code isn't matched at `\G` either.

CodeMirror's part sits on `@lezer/markdown`, which only knows backtick and tilde fences.
It reads `:::{code-cell} python` as a paragraph.
To fix that, `mystCode` adds a small block parser that turns colon-fenced code directives into the same nodes as backtick ones.
Option lines are highlighted by looking back from each one to the directive's opening fence.
YAML option blocks and display math span several lines, and Markdown already parses their lines as headings, code or paragraphs.
Highlighting them needs a block parser that claims those lines before Markdown does.
[Issue #1](https://github.com/choldgraf/myst-syntax/issues/1) tracks adding one for each.

## Shiki drops Markdown's injections

Shiki loses an injected grammar when it loads a second language that Markdown embeds lazily, like `yaml` or `python`.
`Registry.loadLanguage` in `@shikijs/primitive` rebuilds Markdown to pick up the new language.
But vscode-textmate's grammar cache skips the rebuild, so the injections are never registered again.
MyST just stops being highlighted, with no error.
This is [shikijs/shiki#1332](https://github.com/shikijs/shiki/issues/1332).

[Using with Shiki](https://github.com/choldgraf/myst-syntax/blob/main/packages/syntax/README.md#using-with-shiki) has two recipes that avoid it, and `packages/syntax/src/shiki.test.ts` tests both.

## When a Lezer or tree-sitter grammar would be worth it

A real grammar could handle what the regexes can't:

- Directive bodies with their own nested directives and options.
- YAML option blocks and display math in CodeMirror.
- Exact spans for each directive, its argument, options and body.
  Tools need these for folding, outlines or diagnostics.

Highlighting alone doesn't need any of this.
The signal to switch is a tool that needs the structure, like:

- Folding directives in an editor.
- [jupyterlab-myst](https://github.com/jupyter-book/jupyterlab-myst) reading the document.
- A request for Neovim, Helix or Zed, which use tree-sitter.

Until then, the conformance check shows where the regexes fall short.
