// Tokenizes with the MyST grammar, for the tests and `conformance.ts`.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import markdown from '@shikijs/langs/markdown';
import python from '@shikijs/langs/python';
import textmate from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

// Load the grammar the way VS Code does: injected into the Markdown grammar.
const require = createRequire(import.meta.url);
const { INITIAL, Registry } = textmate;
const { loadWASM, OnigScanner, OnigString } = oniguruma;
await loadWASM(readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')).buffer);
const myst = JSON.parse(readFileSync(new URL('../myst.tmLanguage.json', import.meta.url), 'utf8'));
const grammars: Record<string, any> = { 'text.html.markdown': markdown[0], 'source.python': python[0], [myst.scopeName]: myst };
const registry = new Registry({
  onigLib: Promise.resolve({ createOnigScanner: (p) => new OnigScanner(p), createOnigString: (s) => new OnigString(s) }),
  loadGrammar: async (scope) => grammars[scope] ?? null,
  getInjections: (scope) => (scope === 'text.html.markdown' ? [myst.scopeName] : undefined),
});
const grammar = (await registry.loadGrammar('text.html.markdown'))!;

/** The text of each token in `src` whose scopes include `scope`. */
export function scoped(src: string, scope: string) {
  let stack = INITIAL;
  return src.split('\n').flatMap((line) => {
    const { tokens, ruleStack } = grammar.tokenizeLine(line, stack);
    stack = ruleStack;
    return tokens.filter((t) => t.scopes.includes(scope)).map((t) => line.slice(t.startIndex, t.endIndex));
  });
}

export const scopes = {
  role: 'entity.name.function.role.myst',
  directive: 'entity.name.function.directive.myst',
  option: 'entity.other.attribute-name.myst',
  label: 'entity.name.label.myst',
};
