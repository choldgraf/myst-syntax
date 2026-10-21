// Compares the role, directive and label names each part finds with mystmd's parse. See "Conformance" in packages/syntax/CONTRIBUTING.md.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { markdown } from '@codemirror/lang-markdown';
import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { load } from 'js-yaml';
import { mystParse } from 'myst-parser';
import { mystCode } from './src/codemirror.ts';
import { codeDirectives } from './src/rules.ts';
import { highlightedNames, scoped, scopes } from './src/tokenize.ts';

type Case = { id: string; src: string };
const kinds = ['role', 'directive', 'label'] as const;

// Names of directives whose bodies aren't MyST (see docs/findings.md), and of the {math} and {raw} roles.
// A difference in these names isn't a miss.
const excluded = new RegExp('^(?:(?:role|directive) (?:math|raw)|directive (?:mermaid|' + codeDirectives + '))$');

/** Each myst-spec example with MyST source. */
function specCases(): Case[] {
  const dir = new URL('dist/examples/', import.meta.resolve('myst-spec/package.json')); // hoisted by the workspace, so resolve it rather than assume node_modules here
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
    // Without directive specs, an unknown directive's body is left as text, so parse it too.
    if (node.type === 'mystDirective' && !node.children?.length && node.value) walk(mystParse(node.value));
    node.children?.forEach(walk);
  };
  walk(mystParse(src));
  return found;
}

const textmate = (src: string) => kinds.flatMap((kind) => scoped(src, scopes[kind]).map((name) => `${kind} ${name}`));

function codemirror(src: string) {
  const created = EditorState.create({ doc: src, extensions: [markdown({ extensions: [mystCode([])] })] }); // as the JupyterLab extension sets it up
  // Finish parsing the whole document, as an editor does in the background, then pick up the tree.
  ensureSyntaxTree(created, src.length, 10_000);
  const state = created.update({}).state;
  return kinds.flatMap((kind) => highlightedNames(state, kind).map((name) => `${kind} ${name}`));
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
  console.log(`${title}: -name means only mystmd found it, +name means only the part did`);
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
