import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
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

/** Whether `pos` is in Markdown code, such as `x` or ```python, but not in a directive, whose fence also parses as code. */
export function inCode(state: EditorState, pos: number) {
  for (let node = syntaxTree(state).resolveInner(pos, 1); node.parent; node = node.parent) {
    if (node.name === 'InlineCode' || node.name === 'CodeBlock') return true;
    if (node.name === 'FencedCode') {
      const info = node.getChild('CodeInfo');
      return !(info && state.sliceDoc(info.from, info.to).startsWith('{'));
    }
  }
  return false;
}

const highlighters = Object.entries(patterns).map(([name, regexp]) => {
  const mark = Decoration.mark({ class: `cm-myst-${name}` });
  const decorator = new MatchDecorator({ regexp, decoration: (_, view, pos) => (inCode(view.state, pos) ? null : mark) });
  return ViewPlugin.define(
    (view) => ({
      decorations: decorator.createDeco(view),
      update(u: ViewUpdate) {
        // Redo the visible lines whenever the tree changes, since a new code fence changes lines below the edit.
        this.decorations = syntaxTree(u.startState) === syntaxTree(u.state) ? decorator.updateDeco(u, this.decorations) : decorator.createDeco(u.view);
      },
    }),
    { decorations: (p) => p.decorations },
  );
});

const theme = EditorView.baseTheme({
  '&light .cm-myst-role': { color: '#7c3aed' },
  '&light .cm-myst-directive': { color: '#0369a1', fontWeight: 'bold' },
  '&light .cm-myst-option': { color: '#0f766e' },
  '&light .cm-myst-label': { color: '#b45309' },
  '&light .cm-myst-math': { color: '#be185d' },
  '&light .cm-myst-citation': { color: '#15803d' },
  '&dark .cm-myst-role': { color: '#c4b5fd' },
  '&dark .cm-myst-directive': { color: '#7dd3fc', fontWeight: 'bold' },
  '&dark .cm-myst-option': { color: '#5eead4' },
  '&dark .cm-myst-label': { color: '#fcd34d' },
  '&dark .cm-myst-math': { color: '#f9a8d4' },
  '&dark .cm-myst-citation': { color: '#86efac' },
});

/** MyST highlighting for the syntax in `patterns`. Use with `markdown()`. */
export function myst() {
  return [highlighters, theme];
}
