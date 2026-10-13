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
TextMate gets a little state from begin and end rules, and CodeMirror gets some from Markdown's syntax tree and by looking back to a directive's opening fence.
Neither gets a real tree of directives.

Some directives are left alone on purpose.
The body of `{math}` is LaTeX, `{mermaid}` is Mermaid, `{raw}` is whatever format it targets, and code directives hold code in another language.
Highlighting MyST inside them would be wrong: `@property` in a Python cell isn't a citation.
The [README](../README.md) says how each part treats them.

## Conformance results

`npm run conformance` compares each part with mystmd's parser.
For every example, it collects the role names, directive names and target labels from `mystParse`, and the ones each part highlights.
An example matches if both lists are the same, counting repeats.
Examples where neither side finds a name are skipped.

An example is excluded, not missed, when every difference is in `{math}`, `{raw}`, `{mermaid}` or a code directive.
Not reporting their names is the intended behaviour, not a bug.
In myst-spec, TextMate's 4 exclusions are all `{math}`, and CodeMirror's 5 are `{code}` and `{code-block}`, whose fences Markdown parses as code.

| Examples | Part | Matched | Missed | Excluded |
| --- | --- | --- | --- | --- |
| myst-spec (63 with a name) | TextMate | 59 | 0 | 4 |
| myst-spec | CodeMirror | 58 | 0 | 5 |
| Corpus (398 with a name) | TextMate | 308 | 81 | 9 |
| Corpus | CodeMirror | 263 | 83 | 52 |

The corpus is shallow clones of the mystmd, jupyter-book, 2i2c-docs and example-outputs repos: 1554 `.md` files and 9 notebooks.
It isn't checked in; point `MYST_CORPUS` at your own folder to run the same check.

Most corpus misses are noise from the comparison, not highlighting bugs:

- `mystParse` runs without directive specs, so it leaves the bodies of extension directives like `{tab-set}`, `{grid}` and `{card}` unparsed.
  The parts highlight the `{tab-item}` and `{grid-item-card}` directives inside them, which counts as a miss.
- `{index}` adds targets with no label, which no highlighter can match.
- Nested lists whose content is indented 4 spaces are mis-parsed by the Markdown TextMate grammar itself, before MyST sees them.

A few misses are real.
Directives and roles with inline options, like `:::{note .dropdown}` or ``{span .red}`x` ``, aren't highlighted, because the name pattern stops at the space.

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

The recipe is to load `yaml`, then `markdown`, then the grammar, and nothing else.
To load more languages, pass Markdown with its lazy list emptied, so it is never rebuilt.
Both are in [Using with Shiki](../README.md#using-with-shiki), and `src/shiki.test.ts` pins the recipe.

## When a Lezer or tree-sitter grammar would be worth it

A real grammar would reach what the regexes can't:

- Directive bodies with their own nested directives and options.
- YAML option blocks and display math in CodeMirror.
- Exact spans for each directive, its argument, options and body, which tools need for folding, outlines or diagnostics.

Highlighting alone doesn't need any of this.
The signal to switch is a tool that needs the structure: folding directives in an editor, [jupyterlab-myst](https://github.com/jupyter-book/jupyterlab-myst) reading the document, or a request for Neovim, Helix or Zed, which use tree-sitter.
Until then, the conformance check shows where the regexes fall short.
