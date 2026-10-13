// Compares the role, directive and label names each part finds with mystmd's parse. See "Conformance" in the README.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { markdown } from '@codemirror/lang-markdown';
import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { load } from 'js-yaml';
import { mystParse } from 'myst-parser';
import { inCode, patterns } from './src/codemirror.ts';
import { scoped, scopes } from './src/tokenize.ts';

type Case = { id: string; src: string };
const kinds = ['role', 'directive', 'label'] as const;

// Syntax neither part highlights as MyST on purpose (see the README), so a difference in these names isn't a miss.
const excluded = /^(?:(?:role|directive) (?:math|raw)|directive (?:mermaid|code|code-block|code-cell|sourcecode))$/;

/** Each myst-spec example with MyST source. */
function specCases(): Case[] {
  const dir = new URL('node_modules/myst-spec/dist/examples/', import.meta.url);
  return readdirSync(dir)
    .flatMap((file) => (load(readFileSync(new URL(file, dir), 'utf8')) as { cases: { title: string; myst?: string }[] }).cases.filter((c) => c.myst).map((c) => ({ id: `${file}: ${c.title}`, src: c.myst! })));
}

/** Each Markdown file, and each Markdown cell of a notebook, under `root`. */
function corpusCases(root: string): Case[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(?:md|ipynb)$/.test(file) && !/(?:^|\/)(?:node_modules|_build)\//.test(file))
    .flatMap((file) => {
      const text = readFileSync(join(root, file), 'utf8');
      if (file.endsWith('.md')) return [{ id: file, src: text }];
      const cells: { cell_type: string; source: string | string[] }[] = JSON.parse(text).cells;
      return cells.flatMap((c, i) => (c.cell_type === 'markdown' ? [{ id: `${file}: cell ${i}`, src: [c.source].flat().join('') }] : []));
    });
}

/** The names mystmd finds, like `role ref`. */
function mystmd(src: string) {
  const found: string[] = [];
  const fields: Record<string, [string, string]> = { mystRole: ['role', 'name'], mystDirective: ['directive', 'name'], mystTarget: ['label', 'label'] };
  const walk = (node: any) => {
    const field = fields[node.type];
    if (field) found.push(`${field[0]} ${node[field[1]]}`);
    node.children?.forEach(walk);
  };
  walk(mystParse(src));
  return found;
}

const textmate = (src: string) => kinds.flatMap((kind) => scoped(src, scopes[kind]).map((name) => `${kind} ${name}`));

// Line by line and skipping code, as `myst()` does.
function codemirror(src: string) {
  const created = EditorState.create({ doc: src, extensions: [markdown()] });
  // Finish parsing the whole document, as an editor does in the background, then pick up the tree.
  ensureSyntaxTree(created, src.length, 10_000);
  const state = created.update({}).state;
  let from = 0;
  return src.split('\n').flatMap((line) => {
    const found = kinds.flatMap((kind) => [...line.matchAll(patterns[kind])].filter((m) => !inCode(state, from + m.index)).map((m) => `${kind} ${m[1]}`));
    from += line.length + 1;
    return found;
  });
}

/** Names in `a` but not in `b`, counting repeats. */
function minus(a: string[], b: string[]) {
  const rest = [...b];
  return a.filter((name) => {
    const i = rest.indexOf(name);
    if (i >= 0) rest.splice(i, 1);
    return i < 0;
  });
}

/** Prints each miss and a summary table, and returns the number of misses. Cases where neither side finds a name are left out. */
function report(title: string, cases: Case[]) {
  console.log(`${title}: - is a name mystmd found and the part didn't, + the other way round`);
  const counts: Record<string, Record<string, number>> = {};
  for (const [part, find] of [['TextMate', textmate], ['CodeMirror', codemirror]] as const) {
    counts[part] = { matched: 0, missed: 0, excluded: 0 };
    for (const { id, src } of cases) {
      const expected = mystmd(src);
      const found = find(src);
      if (!expected.length && !found.length) continue;
      const diff = [...minus(expected, found).map((n) => `-${n}`), ...minus(found, expected).map((n) => `+${n}`)];
      const misses = diff.filter((n) => !excluded.test(n.slice(1)));
      const status = misses.length ? 'missed' : diff.length ? 'excluded' : 'matched';
      counts[part][status]++;
      if (misses.length) console.log(`  ${part} missed ${id}: ${misses.join(', ')}`);
    }
  }
  console.table(counts);
  return counts.TextMate.missed + counts.CodeMirror.missed;
}

const misses = report('myst-spec', specCases());
if (process.env.MYST_CORPUS) report(process.env.MYST_CORPUS, corpusCases(process.env.MYST_CORPUS));
process.exitCode = misses ? 1 : 0;
