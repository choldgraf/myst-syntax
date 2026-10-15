// MyST rules that grammar.mjs, src/codemirror.ts and conformance.ts share, as regex fragments.

// A role or directive name character.
// mystmd's markdown-it-myst tokenizers allow anything but `}`. This is a narrower set.
export const nameChars = String.raw`[\w:.+-]`;

// A target label character, from mystmd's TARGET_PATTERN in markdown-it-myst/dist/block.js: `^\((?<label>[a-zA-Z0-9|@<>*./_\-+:]{1,100})\)=\s*$`.
export const labelChars = String.raw`[a-zA-Z0-9|@<>*./_\-+:]`;

// The directives whose body mystmd treats as code.
export const codeDirectives = 'code|code-block|code-cell|sourcecode';

// A citation key character, from mystmd's citation regexes in markdown-it-myst/dist/citations.js.
export const citationChars = String.raw`[\w:.#$%&\-+?~/]`;
