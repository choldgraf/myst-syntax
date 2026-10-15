# What we learned

This page records what building myst-syntax taught us about highlighting MyST.
For what each part highlights, see the table in the [README](../README.md).

## What regex highlighters can and can't do for MyST

Both parts are regular expressions layered on an editor's Markdown highlighting.
Each pattern looks at one line, anchored to its start, and has no memory of earlier lines.

That works well for syntax that announces itself on one line.
A role like ``{ref}`x` ``, a fence like ```` ```{note} ````, a label like `(intro)=`, a comment, a citation or inline math can each be recognised from the line alone.

It works badly for syntax whose meaning depends on what came before.
`:class: tip` is an option only on the lines right after a directive's opening fence.
`---` starts YAML options only right after the fence, and is a heading underline or a thematic break elsewhere.
A directive's body is MyST again, so it can hold more directives with their own options, nested to any depth.
A regex can't count fences or know which directive it's inside, so directive bodies and options are the hard part.
TextMate gets a little state from begin and end rules.
CodeMirror gets some from Markdown's syntax tree, and by looking back to a directive's opening fence.
Neither gets a real tree of directives.

Some directives are left alone on purpose.
The body of `{math}` is LaTeX, `{mermaid}` is Mermaid, `{raw}` is whatever format it targets, and code directives hold code in another language.
Highlighting MyST inside them would be wrong.
The [README](../README.md) says how each part treats them.

## Conformance results

`npm run conformance` compares each part with mystmd's parser.
For every example, it collects the role names, directive names and target labels from `mystParse`, and the ones each part highlights.
An example matches if both lists are the same, counting repeats.
Examples where neither side finds a name are skipped.

An example is excluded, not missed, when every difference is in `{math}`, `{raw}`, `{mermaid}` or a code directive.
`grammar.mjs` and `conformance.ts` each type out `{math}`, `{mermaid}` and `{raw}`, so they are kept [in sync by hand](../README.md#what-must-stay-in-sync-by-hand).
In myst-spec, TextMate's 4 exclusions are all `{math}`, and CodeMirror's 5 are `{code}` and `{code-block}`, whose fences Markdown parses as code.

| Examples | Part | Matched | Missed | Excluded |
| --- | --- | --- | --- | --- |
| myst-spec (63 with a name) | TextMate | 59 | 0 | 4 |
| myst-spec | CodeMirror | 58 | 0 | 5 |
| Corpus (398 with a name) | TextMate | 355 | 33 | 10 |
| Corpus | CodeMirror | 294 | 43 | 61 |

The corpus rows come from `MYST_CORPUS=<path> npm run conformance`.
To rebuild it, put these in one folder:

- [jupyter-book/mystmd](https://github.com/jupyter-book/mystmd) at `3b00993`, its `docs/`.
- [jupyter-book/jupyter-book](https://github.com/jupyter-book/jupyter-book) at `11acb1b`, its `docs/`.
- [2i2c-org/docs](https://github.com/2i2c-org/docs) at `c1ca3ba`.
- [jupyter-book/example-outputs](https://github.com/jupyter-book/example-outputs) at `d7ee89e`, the whole repo, for its notebooks.
- Copies of the docs of myst-parser-unified, the docs and demo of mystmd-lsp, and this repo's README and ROADMAP, as they were when the corpus was built.

Most corpus misses are noise from the comparison, not highlighting bugs:

- `{myst}` example directives keep their body as source, but both parts highlight the MyST inside them.
- `{index}` adds targets with no label, which no highlighter can match.

A few misses are real:

- Directives and roles with inline options, like `:::{note .dropdown}` or ``{span .red}`x` ``, aren't highlighted, because the name pattern stops at the space.
- CodeMirror doesn't see a code fence nested inside a backtick directive as code, so it highlights the MyST in it.

## Why TextMate and CodeMirror need different approaches

TextMate's grammar is injected into the editor's Markdown grammar.
Injections run after Markdown's list and blockquote rules have consumed a line's markers and indentation.
So inside `- ` or `> `, the scanner starts mid-line, where `^` never matches.
Every line-anchored rule starts with `(?:^|\G)` instead, since `\G` matches where Markdown left off.
The injection selector also excludes `markup.raw.block`, so indented code isn't matched at `\G` too.

CodeMirror's part sits on `@lezer/markdown`, which only knows backtick and tilde fences.
It reads `:::{code-cell} python` as a paragraph, so `mystCode` adds a small block parser that turns colon-fenced code directives into the same nodes as backtick ones.
Option lines are highlighted by looking back from each one to the directive's opening fence.
YAML option blocks and display math span lines, and Markdown already parses their lines as headings, code or paragraphs.
Highlighting them needs a block parser that claims those lines first, so both are deferred to the Lezer step in the [roadmap](../ROADMAP.md).

## Shiki drops Markdown's injections

Shiki loses an injected grammar once a second language that Markdown embeds lazily, like `yaml` or `python`, is loaded.
`Registry.loadLanguage` in `@shikijs/primitive` rebuilds Markdown to pick up the new language, but vscode-textmate's grammar cache skips the rebuild, so the injections are never registered again.
Nothing is thrown; MyST just isn't highlighted.
It isn't reported to Shiki yet, so there's no issue to link.

[Using with Shiki](../packages/syntax/README.md#using-with-shiki) has two recipes that avoid it, and `src/shiki.test.ts` pins both.

## When a Lezer or tree-sitter grammar would be worth it

A real grammar would reach what the regexes can't:

- Directive bodies with their own nested directives and options.
- YAML option blocks and display math in CodeMirror.
- Exact spans for each directive, its argument, options and body, which tools need for folding, outlines or diagnostics.

Highlighting alone doesn't need any of this.
The signal to switch is a tool that needs the structure: folding directives in an editor, [jupyterlab-myst](https://github.com/jupyter-book/jupyterlab-myst) reading the document, or a request for Neovim, Helix or Zed, which use tree-sitter.
Until then, the conformance check shows where the regexes fall short.
