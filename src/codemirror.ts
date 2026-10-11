import { Decoration, EditorView, MatchDecorator, ViewPlugin, type ViewUpdate } from '@codemirror/view';

/** MyST syntax on top of Markdown. Each regex matches within one line; the whole match is highlighted. */
export const patterns = {
  // Role and directive names use `[\w:.+-]`, like the TextMate grammar. mystmd allows anything but `}`.
  role: /\{[\w:.+-]+\}`[^`\n]*`/g,
  directive: /(?<=^\s*(?:`{3,}|:{3,})\s*)\{[\w:.+-]+\}/g,
  // Approximation of "option lines after a fence": decorators only see one line at a time.
  option: /(?<=^\s*):[\w-]+:(?=\s|$)/g,
  // Label characters follow mystmd's TARGET_PATTERN (markdown-it-myst).
  label: /(?<=^\s*)\([a-zA-Z0-9|@<>*./_\-+:]+\)=(?=\s*$)/g,
  // Close to mystmd's dollarmath: spaces and digits are allowed inside. Skips `$$`, which is display math.
  math: /(?<![\\$])\$[^$\n]+\$(?!\$)/g,
  // Citation key characters follow mystmd's `inText` (markdown-it-myst's citations.js).
  citation: /(?<![\w@])@\w(?:[\w:.#$%&+?~/-]*\w)?/g,
};

// One plugin per pattern, as in CodeMirror's MatchDecorator example.
const highlighters = Object.entries(patterns).map(([name, regexp]) => {
  const decorator = new MatchDecorator({ regexp, decoration: Decoration.mark({ class: `cm-myst-${name}` }) });
  return ViewPlugin.define(
    (view) => ({
      decorations: decorator.createDeco(view),
      update(u: ViewUpdate) {
        this.decorations = decorator.updateDeco(u, this.decorations);
      },
    }),
    { decorations: (p) => p.decorations },
  );
});

const theme = EditorView.baseTheme({
  '.cm-myst-role': { color: '#7c3aed' },
  '.cm-myst-directive': { color: '#0369a1', fontWeight: 'bold' },
  '.cm-myst-option': { color: '#0f766e' },
  '.cm-myst-label': { color: '#b45309' },
  '.cm-myst-math': { color: '#be185d' },
  '.cm-myst-citation': { color: '#15803d' },
});

/** MyST highlighting for the syntax in `patterns`. Use with `markdown()`. */
export function myst() {
  return [highlighters, theme];
}
