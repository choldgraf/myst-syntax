// MyST rules that grammar.mjs, src/codemirror.ts and conformance.ts share, as regex fragments.
// - `nameChars`: a role or directive name character. mystmd's markdown-it-myst role and directive tokenizers allow anything but `}`; we use a narrower set.
// - `labelChars`: a target label character, from mystmd's TARGET_PATTERN in markdown-it-myst/dist/block.js, `^\((?<label>[a-zA-Z0-9|@<>*./_\-+:]{1,100})\)=\s*$`.
// - `codeDirectives`: the directives whose body mystmd treats as code.
// - `citationChars`: a citation key character, from mystmd's citation regexes in markdown-it-myst/dist/citations.js.

export const nameChars = String.raw`[\w:.+-]`;
export const labelChars = String.raw`[a-zA-Z0-9|@<>*./_\-+:]`;
export const codeDirectives = 'code|code-block|code-cell|sourcecode';
export const citationChars = String.raw`[\w:.#$%&\-+?~/]`;
