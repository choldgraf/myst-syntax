import type { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IEditorLanguageRegistry, parseMathIPython } from '@jupyterlab/codemirror';
import { type LanguageDescription, LanguageSupport } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { myst, mystCode } from 'myst-syntax/codemirror';

/**
 * Adds MyST highlighting to `ipythongfm`, the language Lab uses for notebook Markdown cells and .md files (see the README).
 * `support` being writable is undocumented behaviour, checked against @jupyterlab/codemirror 4.5.11.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-myst-syntax:plugin',
  autoStart: true,
  requires: [IEditorLanguageRegistry],
  activate: (_app, languages: IEditorLanguageRegistry) => {
    const spec = languages.findByName('ipythongfm');
    if (!spec) return;
    // Lab's entries have the same `name`, `alias`, `load` and `support` fields as `LanguageDescription`, so cast them.
    // `descriptions` is a snapshot of the registry. A language registered later still highlights in plain fences, since `codeLanguages` looks the registry up live, but not in code directives.
    const descriptions = languages.getLanguages() as unknown as LanguageDescription[];
    const md = markdown({
      base: markdownLanguage,
      codeLanguages: (info) => languages.findBest(info) as unknown as LanguageDescription | null,
      extensions: [parseMathIPython(), mystCode(descriptions)],
    });
    spec.support = new LanguageSupport(md.language, [md.support, myst()]);
  },
};

export default plugin;
