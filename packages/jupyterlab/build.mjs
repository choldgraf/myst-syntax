// JupyterLab loads extensions as webpack module-federation bundles, built by @jupyterlab/builder.
// That bundler only takes JavaScript, so esbuild first compiles our TypeScript to lib/index.js, bundling myst-syntax's built output from the workspace.
// JupyterLab and the CodeMirror packages Lab shares stay external, so the extension uses Lab's copies (CodeMirror breaks with two).
// @codemirror/lang-markdown and @lezer/markdown aren't shared by Lab, so they're bundled.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  external: ['@jupyterlab/*', '@lumino/*', '@codemirror/state', '@codemirror/view', '@codemirror/language', '@lezer/common', '@lezer/highlight'],
  logLevel: 'warning',
});
// Same as `jupyter labextension build .`, minus its `jlpm install`, which doesn't work inside an npm workspace.
// The builder needs the installed JupyterLab's core package metadata (which packages Lab shares).
const core = execFileSync('python', ['-c', 'import jupyterlab, os; print(os.path.join(os.path.dirname(jupyterlab.__file__), "staging"))']);
execFileSync('npx', ['build-labextension', '--core-path', String(core).trim(), '.'], { stdio: 'inherit' });
