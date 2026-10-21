# MyST syntax demo

Open this file in VS Code or JupyterLab with the extension installed, and the MyST syntax below is highlighted.
In VS Code, labels, citations and footnotes share the colour of link text.
JupyterLab doesn't highlight display math.

Roles: {ref}`intro`, {numref}`fig-logo`, {math}`x^2` and {eval}`1 + 1`.
Citations: @smith2020, and [@smith2020; @doe2021, p. 3].
Inline math: $a^2 + b^2 = c^2$, and a substitution: {{ name }}.
A footnote[^1].

(intro)=
## A labelled section

```{figure} logo.svg
:name: fig-logo
:width: 50%

A caption, which is ordinary Markdown.
```

:::{note}
A directive with colon fences.
:::

$$
E = mc^2
$$ (einstein)

% A MyST comment, which isn't rendered.

+++ {"part": "two"}

[^1]: The footnote's text.
