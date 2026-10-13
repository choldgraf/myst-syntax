import { LanguageDescription, ParseContext, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { Decoration, EditorView, MatchDecorator, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { type BlockParser, parseCode } from '@lezer/markdown';
import { citationChars, codeDirectives, labelChars, nameChars } from './rules.ts';

/** MyST syntax on top of Markdown. Each regex matches within one line; the whole match is highlighted. */
export const patterns = {
  role: new RegExp('\\{(' + nameChars + '+)\\}`[^`\\n]*`', 'g'),
  // After any list item markers, like `- ` or `1. `, and the fence.
  directive: new RegExp('(?<=^\\s*(?:(?:[-+*]|\\d+[.)])\\s+)*(?:`{3,}|~{3,}|:{3,})\\s*)\\{(' + nameChars + '+)\\}', 'g'),
  // Highlighted only right after a directive's opening fence; see `highlighted`.
  option: /(?<=^\s*):([\w-]+):(?=\s|$)/g,
  label: new RegExp('(?<=^\\s*)\\((' + labelChars + '+)\\)=(?=\\s*$)', 'g'),
  // Close to mystmd's dollarmath: spaces and digits are allowed inside. Skips `$$`, which is display math.
  math: /(?<![\\$])\$([^$\n]+)\$(?!\$)/g,
  // Each key, alone or in brackets like [@a; @b]. Keys start and end with a word character, as in mystmd's `inText`.
  citation: new RegExp('(?<![\\w@])@(\\w(?:' + citationChars + '*\\w)?)', 'g'),
};

// A code directive's info string, like `{code-cell} python`, and its language.
const codeDirective = new RegExp('^\\{(?:' + codeDirectives + ')\\}\\s*(\\S*)');

// A colon-fenced code directive's opening line, like `:::{code-cell} python`: its fence and info string.
const colonFence = new RegExp('^(:{3,})\\s*(\\{(?:' + codeDirectives + ')\\}.*?)\\s*$');

/** Parses colon-fenced code directives into the same nodes as backtick ones, which Markdown parses as `FencedCode`. */
const colonCode: BlockParser = {
  name: 'ColonCode',
  parse(cx, line) {
    const open = line.text.slice(line.pos).match(colonFence);
    if (!open) return false;
    const from = cx.lineStart + line.pos;
    const info = from + open[0].indexOf(open[2]);
    const children = [cx.elt('CodeMark', from, from + open[1].length), cx.elt('CodeInfo', info, info + open[2].length)];
    for (let first = true; cx.nextLine() && line.depth >= cx.stack.length; first = false) {
      const close = line.text.slice(line.pos).match(/^:+(?=\s*$)/);
      if (close && close[0].length >= open[1].length) {
        children.push(...line.markers, cx.elt('CodeMark', cx.lineStart + line.pos, cx.lineStart + line.pos + close[0].length));
        cx.nextLine();
        break;
      }
      // The newline joins the lines, so the code parser sees them as one text.
      if (!first) children.push(cx.elt('CodeText', cx.lineStart - 1, cx.lineStart));
      children.push(...line.markers, cx.elt('CodeText', cx.lineStart + line.basePos, cx.lineStart + line.text.length));
    }
    cx.addElement(cx.elt('FencedCode', from, cx.prevLineEnd(), children));
    return true;
  },
  endLeaf: (_, line) => colonFence.test(line.text.slice(line.pos)),
};

/**
 * Highlights code directives like ```{code-cell} python in their language, as `markdown({ codeLanguages })` does for ```python.
 * It also parses colon-fenced ones, like :::{code-cell} python, as code.
 * Use as `markdown({ codeLanguages: languages, extensions: [mystCode(languages)] })`, with `languages` from `@codemirror/language-data`.
 */
export function mystCode(languages: readonly LanguageDescription[]) {
  const code = parseCode({
    codeParser(info) {
      const name = info.match(codeDirective)?.[1];
      const found = name ? LanguageDescription.matchLanguageName(languages, name) : null;
      if (!found) return null;
      return found.support ? found.support.language.parser : ParseContext.getSkippingParser(found.load());
    },
  });
  return [code, { parseBlock: [colonCode] }];
}

/** Whether `pos` is in Markdown code, such as `x`, ```python or ```{code-cell}, but not in another directive, whose fence also parses as code. */
export function inCode(state: EditorState, pos: number) {
  for (let node = syntaxTree(state).resolveInner(pos, 1); node.parent; node = node.parent) {
    if (node.name === 'InlineCode' || node.name === 'CodeBlock') return true;
    if (node.name === 'FencedCode') {
      const info = node.getChild('CodeInfo');
      const text = info ? state.sliceDoc(info.from, info.to) : '';
      return !text.startsWith('{') || codeDirective.test(text);
    }
  }
  return false;
}

/** Whether the line at `pos` follows a directive's opening fence, with only option lines between. */
function afterFence(state: EditorState, pos: number) {
  for (let n = state.doc.lineAt(pos).number - 1; n > 0; n--) {
    const text = state.doc.line(n).text;
    if (text.search(patterns.directive) >= 0) return true;
    if (text.search(patterns.option) < 0) return false;
  }
  return false;
}

/** Whether to highlight a match of the pattern `name` at `pos`: not in code, and for options, only right after a directive's opening fence. */
export function highlighted(state: EditorState, name: string, pos: number) {
  return !inCode(state, pos) && (name !== 'option' || afterFence(state, pos));
}

const highlighters = Object.entries(patterns).map(([name, regexp]) => {
  const mark = Decoration.mark({ class: `cm-myst-${name}` });
  const decorator = new MatchDecorator({ regexp, decoration: (_, view, pos) => (highlighted(view.state, name, pos) ? mark : null) });
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
